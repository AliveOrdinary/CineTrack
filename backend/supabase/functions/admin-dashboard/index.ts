import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AdminRequest {
  action: string;
  data?: any;
}

serve(async (req) => {
  // Create a Supabase client with the Auth context of the logged in user
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  )

  // Get the current authenticated user
  const {
    data: { user },
  } = await supabaseClient.auth.getUser()

  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { headers: { 'Content-Type': 'application/json' }, status: 401 }
    )
  }

  // Check if the user is an admin or moderator
  const { data: userRole } = await supabaseClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userRole || (userRole.role !== 'admin' && userRole.role !== 'moderator')) {
    return new Response(
      JSON.stringify({ error: 'Forbidden. Admin access required.' }),
      { headers: { 'Content-Type': 'application/json' }, status: 403 }
    )
  }

  // Parse the request body
  const { action, data } = await req.json() as AdminRequest

  // Define handler functions for different admin actions
  const handlers: Record<string, (data: any) => Promise<any>> = {
    getUserList: async () => {
      const { data: users, error } = await supabaseClient
        .from('users')
        .select('id, email, display_name, role, created_at')
        .order('created_at', { ascending: false })

      if (error) throw error
      return users
    },

    updateUserRole: async (data: { userId: string; role: 'user' | 'moderator' | 'admin' }) => {
      // Only admins can update roles
      if (userRole.role !== 'admin') {
        throw new Error('Only admins can update user roles')
      }

      const { userId, role } = data
      const { data: updatedUser, error } = await supabaseClient
        .from('users')
        .update({ role })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return updatedUser
    },

    suspendUser: async (data: { userId: string; suspend: boolean }) => {
      // Only admins can suspend/unsuspend users
      if (userRole.role !== 'admin') {
        throw new Error('Only admins can modify user suspension status')
      }

      const { userId, suspend } = data

      // Update the dedicated is_suspended column
      const { data: updatedUser, error } = await supabaseClient
        .from('users')
        .update({
          is_suspended: suspend, // Update the correct column
        })
        .eq('id', userId)
        .select('id, email, display_name, role, is_suspended') // Select relevant fields
        .single()

      if (error) throw error
      return updatedUser
    },

    getReportedContent: async () => {
      const { data: reports, error } = await supabaseClient
        .from('report_content')
        .select(`
          *,
          reporter:reporter_id(display_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return reports
    },

    handleReport: async (data: { reportId: string; action: 'approve' | 'reject' }) => {
      const { reportId, action: reportAction } = data
      
      // First get the report to determine content type
      const { data: report, error: reportError } = await supabaseClient
        .from('report_content')
        .select('*')
        .eq('id', reportId)
        .single()

      if (reportError) throw reportError

      // Update the report status
      const { data: updatedReport, error: updateError } = await supabaseClient
        .from('report_content')
        .update({ 
          status: reportAction === 'approve' ? 'approved' : 'rejected',
          updated_at: new Date()
        })
        .eq('id', reportId)
        .select()
        .single()

      if (updateError) throw updateError

      // If approved, take action based on content type
      if (reportAction === 'approve') {
        switch (report.content_type) {
          case 'review':
            await supabaseClient
              .from('reviews')
              .delete()
              .eq('id', report.content_id)
            break
          case 'comment':
            await supabaseClient
              .from('review_interactions')
              .delete()
              .eq('id', report.content_id)
              .eq('interaction_type', 'comment')
            break
          // Handle other content types...
        }
      }

      return updatedReport
    },

    getBasicStats: async () => {
      // Get various statistics for the admin dashboard
      const usersPromise = supabaseClient
        .from('users')
        .select('count', { count: 'exact', head: true })

      const watchedContentPromise = supabaseClient
        .from('watched_content')
        .select('count', { count: 'exact', head: true })

      const reviewsPromise = supabaseClient
        .from('reviews')
        .select('count', { count: 'exact', head: true })

      const listsPromise = supabaseClient
        .from('custom_lists')
        .select('count', { count: 'exact', head: true })

      const [users, watchedContent, reviews, lists] = await Promise.all([
        usersPromise, watchedContentPromise, reviewsPromise, listsPromise
      ])

      return {
        totalUsers: users.count,
        totalWatchedContent: watchedContent.count,
        totalReviews: reviews.count,
        totalLists: lists.count
      }
    },

    getMostWatchedContent: async () => {
      // Get the most watched content
      const { data, error } = await supabaseClient.rpc('get_most_watched_content', {
        limit_count: 10
      })

      if (error) throw error
      return data
    },

    getMostActiveUsers: async () => {
      // Get the most active users
      const { data, error } = await supabaseClient.rpc('get_most_active_users', {
        limit_count: 10
      })

      if (error) throw error
      return data
    }
  }

  try {
    // Execute the requested action if it exists
    if (action in handlers) {
      const result = await handlers[action](data)
      
      return new Response(
        JSON.stringify({ data: result }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { headers: { 'Content-Type': 'application/json' }, status: 400 }
      )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}) 
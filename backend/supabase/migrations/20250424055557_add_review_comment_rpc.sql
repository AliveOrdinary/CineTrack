-- Migration SQL for add_review_comment function

CREATE OR REPLACE FUNCTION add_review_comment(
    review_id_input uuid,
    user_id_input uuid,
    comment_content_input text
)
RETURNS TABLE (
    id uuid,
    review_id uuid,
    user_id uuid,
    interaction_type text,
    content text,
    created_at timestamptz,
    updated_at timestamptz
) -- Returns the newly created comment row
LANGUAGE plpgsql
SECURITY DEFINER -- Important for incrementing count on reviews table
AS $$
DECLARE
  new_comment review_interactions%ROWTYPE;
BEGIN
  -- Insert the new comment
  INSERT INTO public.review_interactions (review_id, user_id, interaction_type, content)
  VALUES (review_id_input, user_id_input, 'comment', comment_content_input)
  RETURNING * INTO new_comment;

  -- Increment the comments_count on the reviews table
  UPDATE reviews
  SET comments_count = comments_count + 1
  WHERE reviews.id = review_id_input;

  -- Return the newly inserted comment row
  RETURN QUERY SELECT *
               FROM public.review_interactions
               WHERE review_interactions.id = new_comment.id;
END;
$$;

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION public.add_review_comment(uuid, uuid, text) TO authenticated;

-- Optional: RLS Policy for review_interactions (ensure users can insert comments)
-- You might already have suitable policies. If not, add something like this:
-- ALTER TABLE public.review_interactions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can insert their own comments" ON public.review_interactions
-- FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Users can view comments" ON public.review_interactions
-- FOR SELECT TO authenticated, anon USING (true); -- Or restrict further if needed

-- Optional: RLS Policy for reviews (ensure function can update comments_count)
-- The SECURITY DEFINER clause bypasses RLS for the duration of the function execution,
-- but ensure the reviews table itself is accessible appropriately.

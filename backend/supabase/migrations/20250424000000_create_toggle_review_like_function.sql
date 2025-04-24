-- Function to toggle a like on a review and update the count atomically
CREATE OR REPLACE FUNCTION toggle_review_like(review_id_input uuid)
RETURNS TABLE(new_likes_count int, liked_by_user boolean)
LANGUAGE plpgsql
SECURITY DEFINER -- Important: Run as the function owner to bypass RLS for the update step if needed
AS $$
DECLARE
    current_user_id uuid := auth.uid(); -- Get the user ID from the session
    interaction_exists boolean;
BEGIN
    -- Check if the user exists
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Check if the review exists (optional, but good practice)
    IF NOT EXISTS (SELECT 1 FROM public.reviews WHERE id = review_id_input) THEN
        RAISE EXCEPTION 'Review not found: %', review_id_input;
    END IF;

    -- Check if a 'like' interaction already exists for this user and review
    SELECT EXISTS (
        SELECT 1
        FROM public.review_interactions
        WHERE review_id = review_id_input
        AND user_id = current_user_id
        AND interaction_type = 'like'
    ) INTO interaction_exists;

    IF interaction_exists THEN
        -- User has already liked, so unlike (delete interaction, decrement count)
        DELETE FROM public.review_interactions
        WHERE review_id = review_id_input
        AND user_id = current_user_id
        AND interaction_type = 'like';

        UPDATE public.reviews
        SET likes_count = likes_count - 1
        WHERE id = review_id_input;

        liked_by_user := false;
    ELSE
        -- User has not liked, so like (insert interaction, increment count)
        INSERT INTO public.review_interactions (review_id, user_id, interaction_type)
        VALUES (review_id_input, current_user_id, 'like');

        UPDATE public.reviews
        SET likes_count = likes_count + 1
        WHERE id = review_id_input;

        liked_by_user := true;
    END IF;

    -- Return the new like count and the user's current like status
    SELECT r.likes_count INTO new_likes_count
    FROM public.reviews r
    WHERE r.id = review_id_input;

    RETURN QUERY SELECT new_likes_count, liked_by_user;
END;
$$; 
-- Update the review creation policy to allow reviews for shipped orders as well
DROP POLICY "Users can create reviews for their orders" ON reviews;

CREATE POLICY "Users can create reviews for their orders" ON reviews
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 
    FROM orders 
    WHERE orders.id = reviews.order_id 
    AND orders.user_id = auth.uid() 
    AND (orders.status = 'delivered'::order_status OR orders.status = 'shipped'::order_status)
  )
);
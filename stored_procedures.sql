-- Function to update todo orders when moving a todo
CREATE OR REPLACE FUNCTION update_todos_order_after_move(p_old_category_id UUID, p_old_order INT)
RETURNS VOID AS $$
BEGIN
  UPDATE todos
  SET "order" = "order" - 1
  WHERE category_id = p_old_category_id AND "order" > p_old_order;
END;
$$ LANGUAGE plpgsql;

-- Function to update todo orders before inserting
CREATE OR REPLACE FUNCTION update_todos_order_before_insert(p_new_category_id UUID, p_new_order INT)
RETURNS VOID AS $$
BEGIN
  UPDATE todos
  SET "order" = "order" + 1
  WHERE category_id = p_new_category_id AND "order" >= p_new_order;
END;
$$ LANGUAGE plpgsql;

-- Function to update todo orders when moving up
CREATE OR REPLACE FUNCTION update_todos_order_move_up(p_category_id UUID, p_old_order INT, p_new_order INT)
RETURNS VOID AS $$
BEGIN
  UPDATE todos
  SET "order" = "order" + 1
  WHERE category_id = p_category_id 
  AND "order" >= p_new_order 
  AND "order" < p_old_order;
END;
$$ LANGUAGE plpgsql;

-- Function to update todo orders when moving down
CREATE OR REPLACE FUNCTION update_todos_order_move_down(p_category_id UUID, p_old_order INT, p_new_order INT)
RETURNS VOID AS $$
BEGIN
  UPDATE todos
  SET "order" = "order" - 1
  WHERE category_id = p_category_id 
  AND "order" > p_old_order 
  AND "order" <= p_new_order;
END;
$$ LANGUAGE plpgsql;

-- Functions for category reordering
CREATE OR REPLACE FUNCTION update_categories_order_move_up(p_user_id UUID, p_old_order INT, p_new_order INT)
RETURNS VOID AS $$
BEGIN
  UPDATE categories
  SET "order" = "order" + 1
  WHERE user_id = p_user_id 
  AND "order" >= p_new_order 
  AND "order" < p_old_order;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_categories_order_move_down(p_user_id UUID, p_old_order INT, p_new_order INT)
RETURNS VOID AS $$
BEGIN
  UPDATE categories
  SET "order" = "order" - 1
  WHERE user_id = p_user_id 
  AND "order" > p_old_order 
  AND "order" <= p_new_order;
END;
$$ LANGUAGE plpgsql; 

    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      result json;
    BEGIN
      EXECUTE sql_query;
      RETURN json_build_object('success', true, 'message', 'Query executed successfully');
    EXCEPTION
      WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM, 'sqlstate', SQLSTATE);
    END;
    $$;
  
SELECT 'CREATE DATABASE test_markface'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'test_markface')\gexec
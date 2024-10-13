import { useAppSelector } from "@/hooks/hooks";
import { selectEditedFiles } from "@/API/editor-api/editor-api.slice";
import Editor from "../Editor/editor";
import DynamicForm from "../Editor/dynamic-form";

const yamlContent = `$schema: 'https://json-schema.org/draft/2020-12/schema'
title: SQLite table
type: object
properties: 
  general:
    type: object
    description: Table properties
    properties:
      table_name:
        description: Table name
        type: string
      schema-name:
        description: Schema name
        type: string
  physical_options:
    type: object
    description: Physical options
    properties:
      strict:
        description: Defines if the datatypes are enforced by DB
        type: boolean
      without_rowid:
        description: Defines if the table has ROWID
        type: boolean
  columns:
    type: array
    items: 
      type: object
      description: Column definition
      required: 
        - column_name
        - datatype
      Unique_properties:
        - column_name
      properties:
        column_name: 
          description: Column name in DB
          type: string
        comment:
          description: Provides business definition of the column
          type: string
        datatype:
          description: Datatype of column
          type: string
          enum: 
            - INT
            - INTEGER
            - TINYINT
            - SMALLINT
            - MEDIUMINT
            - BIGINT
            - UNSIGNED BIG INT
            - INT2
            - INT8
            - CHARACTER
            - VARCHAR
            - VARYING CHARACTER
            - NCHAR
            - NATIVE CHARACTER
            - NVARCHAR
            - TEXT
            - CLOB
            - BLOB
            - REAL
            - DOUBLE
            - DOUBLE PRECISION
            - FLOAT
            - NUMERIC
            - DECIMAL
            - BOOLEAN
            - DATE
            - DATETIME
        size:
          type: integer
          valid_for: 
            property: datatype
            enum: 
              - CHARACTER
              - VARCHAR
              - VARYING CHARACTER
              - NCHAR
              - NATIVE CHARACTER
              - NVARCHAR
              - NUMERIC
        precision:
          type: integer
          valid_for: 
            property: datatype
            enum: 
              - NUMERIC
        column_constraints:
          type: array
          items:
            type: object
            description: Constraint definition
            required: 
              - constraint_type
            Properties:
              constraint_type:
                description: Type of constraint
                type: string
                enum:
                  - PRIMARY KEY
                  - NOT NULL
                  - UNIQUE
                  - CHECK
                  - DEFAULT
                  - COLLATE
                  - GENERATED ALWAYS
              pk_ordering:
                description: Primary key order
                type: string
                enum: 
                  - ASC
                  - DESC
                  - null
                valid_for: 
                  property: constraint_type
                  enum:
                    - PRIMARY KEY
              conflict_clause:
                description: On conflict clause
                type: string
                enum: 
                  - ROLLBACK
                  - ABORT
                  - FAIL
                  - IGNORE
                  - REPLACE
                valid_for: 
                  property: constraint_type
                  enum:
                    - PRIMARY KEY
                    - NOT NULL
                    - UNIQUE
              autoincrement:
                description: Auto-increment
                type: boolean
                valid_for: 
                  property: constraint_type
                  enum:
                    - PRIMARY KEY
              expression:
                description: Expresion 
                type: string
                valid_for: 
                  property: constraint_type
                  enum:
                    - CHECK
                    - DEFAULT
                    - GENERATED ALWAYS
              collation_name:
                description: Collation name
                type: string
                valid_for: 
                  property: constraint_type
                  enum:
                    - COLLATE
              generated_col_type:
                description: Generated column type
                type: string
                enum:
                  - STORED
                  - VIRTUAL
                  - null
                valid_for: 
                  property: constraint_type
                  enum:
                    - GENERATED ALWAYS
        foreign_key:
          description: Foreign key definition for column
          type: object
          properties:
            referenced_table:
              description: Referenced talbe
              type: string
            referenced_column:
              description: Referenced column
              type: string
            deferrable:
              description:
              type: string
              enum:
                - NOT DEFERRABLE
                - DEFERRABLE INITIALLY DEFERRED
                - DEFERRABLE INITIALLY IMMEDIATE
  table_constraints:
    type: array
    items:
      type: object
      description: Column definition
      required: 
        - constraint_type
      Properties:
        constraint_name:
          description: Name of constraint
          type: string
        constraint_type:
          description: Type of constraint
          type: string
          enum:
            - PRIMARY KEY
            - UNIQUE
            - CHECK
        constrained_columns:
          type: array
          items:
            type: string
        pk_ordering:
          description: Primary key order
          type: string
          enum: 
            - ASC
            - DESC
            - null
          valid_for: 
            property: constraint_type
            enum:
              - PRIMARY KEY
        conflict_clause:
          description: On conflict clause
          type: string
          enum: 
            - ROLLBACK
            - ABORT
            - FAIL
            - IGNORE
            - REPLACE
          valid_for: 
            property: constraint_type
            enum:
              - PRIMARY KEY
              - UNIQUE
        autoincrement:
          description: Auto-increment
          type: boolean
          valid_for: 
            property: constraint_type
            enum:
              - PRIMARY KEY
  foreign_key:
    description: Foreign key definition for column
    type: object
    properties:
      constrained_columns:
        description: Constrained column
        type: array
        items:
          type: string
      referenced_table:
        description: Referenced talbe
        type: string
      referenced_column:
        description: Referenced column
        type: array
        items:
          type: string
      deferrable:
        description:
        type: string
        enum:
          - NOT DEFERRABLE
          - DEFERRABLE INITIALLY DEFERRED
          - DEFERRABLE INITIALLY IMMEDIATE`;

export default function ContentArea() {
  const editorData = useAppSelector(selectEditedFiles);

  return (
    <div className="flex-1 bg-muted flex flex-col overflow-hidden">
      {editorData.length ? (
        <Editor />
      ) : (
        <div className="flex flex-col flex-1 text-muted-foreground">
          {/* Push Ctrl + Shift + N to start new project*/}
          <DynamicForm
            yamlSchema={
              yamlContent /* justify-center items-center text-muted-foreground*/
            }
          />
        </div>
      )}
    </div>
  );
}

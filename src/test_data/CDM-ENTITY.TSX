const yaml_schema = `$schema: "https://json-schema.org/draft/2020-12/schema"
title: CDM Entity
type: object
properties:
  general:
    type: object
    title: Default objet properties
    description: Default objet properties
    required:
      - name
      - template
    properties:
      name:
        title: Name
        description: CDM Entity Name
        type: string
      comment:
        title: Description
        description: CMD Entity description
        type: string
        fromat: text
      template:
        title: Template
        description: CDM entity Template
        type: string
      tags:
        title: Tags
        type: array
        items:
          type: string
  attributes:
    title: Attributes
    description: CDM entity attributes
    type: array
    items:
      type: object
      description: Attribute definition
      required:
        - name
      Unique_properties:
        - name
      properties:
        name:
          description: Attribute name
          type: string
        comment:
          description: Provides definition of the atribute
          type: string
        TestObject:
          title: test object
          description: this property is used to test nested objects
          type: object
          properties:
            prop1:
              type: string
              title: Property 1
              description: this is test property 1
            prop2:
              type: string
              title: Property 2
              description: this is test property 2`;

export default yaml_schema;

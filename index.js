const validateSchema = require('yaml-schema-validator')

validateSchema('target/build_spec.yaml', {
    schemaPath: 'schema/schema.yaml'
})
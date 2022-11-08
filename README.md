# oci-devops-build-spec-validator

OCI DevOps の build_spec.yaml の簡易的な構文チェックを行うためのツールです．

## Prerequires

- node.js: v12.22.9+
- npm: 8.5.1+

## How to use

依存ライブラリをインストールします．

```bash
npm install
```

`target/build_spec.yaml`を構文チェックしたい内容に置き換えます．

実行します．

```bash
node index.js
```

## examples

### example: 1

```yaml
version: 0.1
component: build
timeoutInSeconds: 1000
shell: bash

steps:
  - type: Command
    name: "Build app"
    command: |
      mvn clean install
```

実行結果

```bash
SUCCESS : Schema Validated Successfully
```

### example: 2

```yaml
version: 0.1
component: build
timeoutInSeconds: 6000
shell: bash
failImmediatelyOnError: true
env:
  exportedVariables:
    - BuildServiceDemoVersion

steps:
  - type: Command
    name: "Build Source"
    timeoutInSeconds: 4000
    failImmediatelyOnError: true
    command: |
      echo $PATH
      mvn clean install
  - type: Command
    timeoutInSeconds: 400
    name: "Dockerizer"
    command: |
      BuildServiceDemoVersion=`echo ${OCI_BUILD_RUN_ID} | rev | cut -c 1-7`
      echo $BuildServiceDemoVersion
      docker build -t build-service-demo

  - type: VulnerabilityAudit
    name: "Scan my maven repo"
    vulnerabilityAuditName: Report-${buildRunId}
    vulnerabilityAuditCompartmentId: ocid1.compartment.oc1.iad.restoftheocid
    knowledgeBaseId: ocid1.knowledgebase.oc1.iad.restoftheocid
    configuration:
      buildType: maven
      pomFilePath: ./pom.xml
      packagesToIgnore:
        - "oracle.jdbc.*"
        - "org.apache.logging.log4j:1.2"
      maxPermissibleCvssV2Score: 5.0
      maxPermissibleCvssV3Score: 5.1
      freeFormTags:
        key1: value1
        key2: value2

outputArtifacts:
  - name: build-service-demo
    type: DOCKER_IMAGE
    location: build-service-demo
  - name: build-service-demo-kube-manifest
    type: BINARY
    location: deployment/app.yml
```

実行結果

```bash
ERROR : ====== Schema Validation Error ======
ERROR : 0 mismatches and 2 warnings found.
1. steps.2.configuration.packagesToIgnore is not present in schema
2. steps.2.configuration.freeFormTags is not present in schema
```

### example: 3

```yaml
version: 0.1
component: build
timeoutInSeconds: 6000
shell: bash

# Variables
env:
  variables:
    "testEnv" : "testValue1"
  vaultVariables:
    docker_registry_password : <secret-ocid>
  exportedVariables:
    - patch_number
    - build_Result

inputArtifacts:
  - name: hello-dev-jar
    type: STAGE_ARTIFACT
    location: /workspace/Source/hello123.class
  - name: public-artifact
    type: URL
    url: https://raw.githubusercontent.com/apache/kafka/trunk/README.md  #URL must be publicly accessible
    location: /workspace/Source/readme.md
  - name: shell_script
    type: GENERIC_ARTIFACT
    artifactId: ocid1.genericartifact.oc1.iad.0.restoftheocid #appropriate policy is required for access
    location: /workspace/Source/script.sh
  - name: shell_script
    type: GENERIC_ARTIFACT
    registryId: ocid1.artifactrepository.oc1.iad.0.restoftheocid #appropriate policy is required for access
    path: some_script.sh
    version: 2.0
    location: /workspace/Source/script.sh

steps:
  - type: Command
    name: "Build Source"
    timeoutInSeconds: 4000
    shell: /bin/sh
    command: |
      # oci cli pre configured with build pipeline resource principal
      oci os ns get
      javac HelloWorld.java
    onFailure:
      - type: Command
        timeoutInSeconds: 400
        shell: /bin/sh
        command: |
          echo "Handling Failure"
          build_result=FAILURE
          echo "Failure successfully handled"
        timeoutInSeconds: 400
  - type: Command
    timeoutInSeconds: 400
    name: "Dockerizer & Test"
    command: |
      docker build -t test-image .
    onFailure:
      - type: Command
        command: |
          echo "Handling Failure"
          build_result=FAILURE
          echo "Failure successfully handled"
        timeoutInSeconds: 400
  - type: Command
    timeoutInSeconds: 400
    name: "Dockerizer & Test"
    command: |
      build_result=SUCESS
      patch_number==`echo ${OCI_BUILD_RUN_ID} | rev | cut -c 1-7`

outputArtifacts:
  - name: kube-manifest
    type: BINARY
    location: ${OCI_WORKSPACE_DIR}/Source/app.yml
  - name: hello-dev-image
    type: DOCKER_IMAGE
    location: test-image
```

実行結果

```bash
ERROR : YAMLException: duplicated mapping key at line 52, column 9:
            timeoutInSeconds: 400
            ^
```

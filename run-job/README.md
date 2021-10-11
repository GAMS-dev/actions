# Run GAMS Job Action

This action allows you to run GAMS jobs on GAMS Engine to verify that your model can still compile and execute properly.

### Example
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
      with:
        ref: ${{ github.ref }}
    - name: Archive model files
        run: |
          zip -r model.zip trnsport.gms
    - name: Run trnsport
        id: runTrnsport
        uses: GAMS-dev/actions/run-job@v1
        with:
          url: ${{ secrets.ENGINE_URL }}
          namespace: ${{ secrets.ENGINE_NS }}
          username: ${{ secrets.ENGINE_USER }}
          password: ${{ secrets.ENGINE_PASSWORD }}
          run: 'trnsport.gms'
          arguments: 'a=c'
          model_data: '${{ github.workspace }}/model.zip'
```

### Inputs

## `url`

**Required** URL to Engine API (e.g. https://example.com/api)

## `namespace` (default: global)

**Required** Name of the namespace where model will be executed

## `username` (default: admin)

Name of the Engine user (requires write and execute permissions in the namespace)

## `password`

Password of the user

## `token`

JWT token to use (will be used instead of username/password if provided)

## `model`

Name of model (default: name of repository)

## `run`

Name of the main gms file with its extension. Will use model + .gms if not provided.

## `arguments`

Command line arguments to use (comma-separated)

## `inex_string`

Optional JSON string to filter the contents of the result zip file

## `labels`

Labels that will be attached to the job in key=value format

## `model_data`

Absolute path to zip file containing model files

## `data`

Absolute path to zip file containing data

## `text_entries`

Text entries to register (comma-separated)

## `stream_entries`

Stream entries to register (comma-separated)

## `dep_tokens`

Tokens of jobs on which this job depends (comma-separated). The order defines the order in which the results of dependent jobs are extracted.

## `fail_on_error` (default: yes)

**Required** Whether the action should fail if the GAMS return code is not 0 (yes/no)

## `delete_results` (default: yes)

**Required** Whether results should be deleted when job finishes (yes/no)

## `timeout` (default: 600)

**Required** Timeout in seconds before actions fails (0 to disable)

### Outputs

## `token`

The token of the job

## `return_code`

The return code of the GAMS process (see [here](https://www.gams.com/latest/docs/UG_GAMSReturnCodes.html) )

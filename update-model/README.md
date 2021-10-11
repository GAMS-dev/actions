# Update GAMS Model Action

This action allows you to register/update GAMS model on GAMS Engine.

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
    - name: Update model
        id: updateModel
        uses: GAMS-dev/actions/update-model@v1
        with:
          url: ${{ secrets.ENGINE_URL }}
          namespace: ${{ secrets.ENGINE_NS }}
          username: ${{ secrets.ENGINE_USER }}
          password: ${{ secrets.ENGINE_PASSWORD }}
          model: 'trnsport_${{ github.event.release.tag_name }}'
          run: 'trnsport.gms'
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

## `data`

Absolute path to zip file containing data

## `text_entries`

Text entries to register (comma-separated)

## `stream_entries`

Stream entries to register (comma-separated)

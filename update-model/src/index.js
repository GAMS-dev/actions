const core = require('@actions/core')
const FormData = require('form-data')
const axios = require('axios')
const fs = require('fs')


const updateModel = async () => {
  let headers = {}
  if (!!core.getInput('token')) {
    core.debug('Using Bearer auth')
    headers['Authorization'] = `Bearer ${core.getInput('token')}`
  } else if (!!core.getInput('username') || !!core.getInput('password')) {
    core.debug('Using Basic auth')
    headers['Authorization'] = `Basic ${Buffer.from(core.getInput('username') + ':' + core.getInput('password')).toString('base64')}`
  }
  let inexString = ''
  if (!!core.getInput('inex_string')) {
    try {
      inexString = JSON.parse(core.getInput('inex_string'))
    } catch (error) {
      core.error('Could not parse "inex_string" value (invalid JSON)')
      core.setFailed(error.message)
      return
    }
  }
  const formData = new FormData()
  let modelUrl = ''
  try {
    const engineUrl = core.getInput('url', { required: true })
    const namespace = core.getInput('namespace', { required: true })
    const modelName = core.getInput('model') || core.getInput('run', { required: true }).split('.gms')[0]
    modelUrl = engineUrl + '/namespaces/' + namespace + '/models/' + modelName
    const formDataUpdate = new FormData()
    formData.append('run', core.getInput('run', { required: true }))
    if (!!core.getInput('data')) {
      formDataUpdate.append('data', fs.createReadStream(core.getInput('data')))
    }
    if (!!inexString) {
      formData.append('inex_string', inexString)
      formDataUpdate.append('inex_string', inexString)
    } else {
      formDataUpdate.append('delete_inex_file', 'true')
    }
    ['text_entries', 'stream_entries', 'arguments'].forEach(el => {
      if (!!core.getInput(el)) {
        const value = core.getInput(el).trim().split(',');
        for (let i = 0; i < value.length; i++) {
          formData.append(el, value[i].trim())
          formDataUpdate.append(el, value[i].trim());
        }
      } else {
        formDataUpdate.append('delete_' + el, 'true');
      }
    })
    core.debug('Request data: ' + JSON.stringify(formDataUpdate))
    const formHeadersUpdate = formDataUpdate.getHeaders()
    formHeadersUpdate['content-length'] = await new Promise((resolve, reject) => {
      formDataUpdate.getLength((err, length) => {
        if (err) {
          reject(err)
          return
        }
        resolve(length)
      })
    })
    await axios.patch(modelUrl,
      formDataUpdate,
      {
        headers: {
          ...formHeadersUpdate,
          ...headers
        }
      })
  } catch (error) {
    if (error.response && error.response.data) {
      if (error.response.status === 404 && error.response.data.message && error.response.data.message.startsWith('Model')) {
        if (!!core.getInput('data')) {
          formData.append('data', fs.createReadStream(core.getInput('data')))
        }
        const formHeaders = formData.getHeaders()
        formHeaders['content-length'] = await new Promise((resolve, reject) => {
          formData.getLength((err, length) => {
            if (err) {
              reject(err)
              return
            }
            resolve(length)
          })
        })
        await registerModel(modelUrl, formData, {
          ...formHeaders,
          ...headers
        })
      } else {
        core.setFailed(JSON.stringify(error.response.data))
      }
    } else {
      core.setFailed(error.message)
    }
  }
}

registerModel = async (modelUrl, formData, headers) => {
  try {
    core.debug('Adding new model')
    core.debug('Request data: ' + JSON.stringify(formData))
    await axios.post(modelUrl,
      formData,
      {
        headers: headers
      })
  } catch (error) {
    if (error.response && error.response.data) {
      core.setFailed(JSON.stringify(error.response.data))
    } else {
      core.setFailed(error.message)
    }
  }
}

updateModel()

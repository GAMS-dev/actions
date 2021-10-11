const core = require('@actions/core')
const FormData = require('form-data')
const axios = require('axios')
const fs = require('fs')


const runGams = async () => {
  const headers = {}
  if (!!core.getInput('token')) {
    core.debug('Using Bearer auth')
    headers['Authorization'] = `Bearer ${core.getInput('token')}`
  } else if (!!core.getInput('username') || !!core.getInput('password')) {
    core.debug('Using Basic auth')
    headers['Authorization'] = `Basic ${Buffer.from(core.getInput('username') + ':' + core.getInput('password')).toString('base64')}`
  }
  let inexString = ''
  const deleteResults = core.getInput('delete_results', { required: true }) !== 'no'
  if (!!deleteResults) {
    inexString = '{"type": "include", "files": []}'
  } else if (!!core.getInput('inex_string')) {
    try {
      inexString = JSON.parse(core.getInput('inex_string'))
    } catch (error) {
      core.error('Could not parse "inex_string" value (invalid JSON)')
      core.setFailed(error.message)
      return
    }
  }
  const timeout = parseInt(core.getInput('timeout', { required: true }), 10)
  if (isNaN(timeout)) {
    core.error('Invalid "timeout" string value (must be integer)')
    core.setFailed('Invalid "timeout" string value (must be integer)')
  }
  const failOnError = core.getInput('fail_on_error', { required: true }).trim() !== 'no'
  try {
    const engineUrl = core.getInput('url', { required: true })
    const jobSubmissionForm = new FormData()
    jobSubmissionForm.append('namespace', core.getInput('namespace', { required: true }))
    if (!!core.getInput('run')) {
      jobSubmissionForm.append('model', core.getInput('model') || core.getInput('run').split('.gms')[0])
      jobSubmissionForm.append('run', core.getInput('run'))
    } else {
      jobSubmissionForm.append('model', core.getInput('model', { required: true }))
    }
    if (!!core.getInput('model_data')) {
      jobSubmissionForm.append('model_data', fs.createReadStream(core.getInput('model_data')))
    }
    if (!!core.getInput('data')) {
      jobSubmissionForm.append('data', fs.createReadStream(core.getInput('data')))
    }
    if (!!inexString) {
      jobSubmissionForm.append('inex_string', inexString)
    }
    ['labels', 'dep_tokens', 'text_entries', 'stream_entries', 'arguments'].forEach(el => {
      if (!!core.getInput(el)) {
        const value = core.getInput(el).trim().split(',');
        for (let i = 0; i < value.length; i++) {
          jobSubmissionForm.append(el, value[i].trim());
        }
      }
    })
    core.debug('Request data: ' + JSON.stringify(jobSubmissionForm))
    const formHeaders = jobSubmissionForm.getHeaders()
    formHeaders['content-length'] = await new Promise((resolve, reject) => {
      jobSubmissionForm.getLength((err, length) => {
        if (err) {
          reject(err)
          return
        }
        resolve(length)
      })
    })
    const resPostJob = await axios.post(engineUrl + '/jobs/',
      jobSubmissionForm,
      {
        headers: {
          ...formHeaders,
          ...headers
        }
      })
    const token = resPostJob.data.token;
    core.debug('Job token: ' + JSON.stringify(token))
    core.setOutput('token', JSON.stringify(token))
    let timeRemaining = timeout
    while (true) {
      const resJobStatus = await axios.get(engineUrl + '/jobs/' + token,
        {
          headers: {
            ...headers,
            "X-Fields": "process_status"
          }
        })
      if (resJobStatus.data.process_status == null) {
        core.debug('Job still running..')
        if (timeout > 0) {
          timeRemaining -= 2
          if (timeRemaining <= 0) {
            core.setFailed('Job timed out after: ' + timeout + ' seconds')
            return
          }
        }
        await new Promise(r => setTimeout(r, 2000))
      } else {
        if (failOnError && resJobStatus.data.process_status !== 0) {
          core.setFailed('Job failed with return code: ' + JSON.stringify(resJobStatus.data.process_status))
        } else {
          core.setOutput('return_code', JSON.stringify(resJobStatus.data.process_status))
        }
        if (deleteResults) {
          await axios.delete(engineUrl + '/jobs/' + token + '/result',
            {
              headers: headers
            })
        }
        return
      }
    }
  } catch (error) {
    if (error.response && error.response.data) {
      core.setFailed(JSON.stringify(error.response.data))
    } else {
      core.setFailed(error.message)
    }
  }
}

runGams()

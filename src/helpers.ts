import * as exec from '@actions/exec'

export async function getRemoteVersion(repo: string): Promise<string> {
  return execPromise(
    `git ls-remote --tags --sort="-v:refname" ${repo} | grep -P "refs/tags/v?\\d+.\\d+.\\d+$" | head -n 1 | awk "{print $2}" | awk -F/ "{print $NF}"`
  )
}

export function getLocalVersion(): string {
  return ''
}

async function execPromise(command: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    exec.exec(command, [], {
      listeners: {
        stdout: data => {
          resolve(data.toString())
        },
        stderr: data => {
          reject(data.toString())
        }
      }
    })
  })
}

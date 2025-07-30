# scripts/tx-docker.ps1

# Path to .transifexrc
$transifexrc = "$HOME\.transifexrc"

# Default certificate path — update if needed
$certHostPath = "C:\ProgramData\Docker\certs.d\ca.pem"
$certDockerPath = "/etc/ssl/certs/ca-certificates.crt"

# Current working directory
$workDir = Get-Location

docker run --rm -it `
  -v "$transifexrc:/.transifexrc" `
  -v "$certHostPath:$certDockerPath" `
  -v "$workDir:/app" `
  -w /app `
  transifex/txcli $args

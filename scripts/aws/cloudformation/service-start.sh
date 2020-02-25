#!/usr/bin/env bash

printf "Starting tasking-manager service..."

if [[ ! -f /etc/systemd/system/tasking-manager.service ]]; then
  /bin/systemctl start tasking-manager.service
  /bin/sleep 10
  printf "Tasking-manager service started."
else
  printf "Tasking-manager service does not exist; Failed."
fi


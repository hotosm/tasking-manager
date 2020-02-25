#!/usr/bin/env bash

printf "Stopping tasking-manager service..."

if [[ ! -f /etc/systemd/system/tasking-manager.service ]]; then
  /bin/systemctl stop tasking-manager.service
  /bin/sleep 10
  printf "Tasking-manager service stopped"
else
  printf "Tasking-manager service does not exist; Failed."
fi

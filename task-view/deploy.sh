rsync -v \
      --exclude node_modules \
      --exclude .cache \
      --exclude .DS_Store \
      -r . $SSH_AWS_HOST:task-view

## Docker setup and testing for (non)developers

The tasking-manager docker image comes with pre-built client modules and server requirements. To start all required services to run tasking manager locally, run
```
make up
```

Also, you can edit and execute client tests with `make test-client`. For server tests you need to run `make test-server`. For both, the command is `make tests`.


With this approach users and developers have the possibility to review and setup their own instance of tasking manager without the need of installation or configuration of the resources. Hence, it becomes possible to examine Pull requests, executing
```
make PRNUMBER=prnumber
```
where `prnumber` corresponds to the pull request number created on github.

Finally, to destroy running containers for all services, please run
```
make down
```

*Notes.*

1. It is important to set the hotosm/tasking-manager remote as origin.
2. When a new client module or server requirement is included within their respective files, remember to rebuild dockerfile image, executing the following command
```
make build
```
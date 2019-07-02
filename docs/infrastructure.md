# Infrastructure

## Building AMI images

1. Create a simple file to add ENVVAR to shell

```
$ cat tasking-manager-dev.env
export AWS_SECRET_ACCESS_KEY=<SECRET_ACCESS_KEY_STRING>
export AWS_ACCESS_KEY_ID=<ACCESS_KEY_ID>
export PACKER_RUN_OWNER=<EMAIL@HOTOSM.ORG>
```

2. Source file and run packer build

```
$ source tasking-manager-dev.env
$ packer build ami.json
amazon-ebs output will be in this color.

==> amazon-ebs: Prevalidating AMI Name: tasking-manager-1562049464
...SNIP...
==> amazon-ebs: Cleaning up any extra volumes...
==> amazon-ebs: No volumes to clean up, skipping
==> amazon-ebs: Deleting temporary security group...
==> amazon-ebs: Deleting temporary keypair...
Build 'amazon-ebs' finished.

==> Builds finished. The artifacts of successful builds are:
--> amazon-ebs: AMIs were created:
us-east-1: ami-045d92b3f02d57737
```

3. The AMI ID at the end

For machine readable output[1], add the `-machine-readable` switch like so:

```
$ packer -machine-readable build ami.json
```


## References

1. Packer Machine Readable outputs - https://www.packer.io/docs/commands/index.html

# README - PACKER IMAGE BUILDER

1. Export the name of the profile section used in `~/.aws/credentials`

```
$ cat ~/.aws/credentials
[audit]
region = us-east-1
aws_access_key_id = AKIALONGKEYIDA
aws_secret_access_key = gN...........................+Hvs

[hotosm]
region = us-east-1
aws_secret_access_key = bGo2H.........................FVD
aws_access_key_id = AKIAZONGKEYXZW

$ export AWS_PROFILE=hotosm
```

alternatively, you can set environment variables for Access Key ID and Secret
Access Key

```
$ export AWS_ACCESS_KEY_ID=AKIA....XYZ
$ export AWS_SECRET_ACCESS_KEY=bGo2H....FVD
```

2. Test if the bootstrap script is valid

```
$ bash -n infra/bootstrap.sh
```

3. Run packer from the root directory.

```
$ packer build infra/ami.json
...
Build `amazon-ebs` finished
```

## Troubleshooting

Run packer with debug flag

```
$ packer build -debug infra/ami.json
```

You can login to the machine using the temporary SSH key to figure out what's
happening on the instance. Find public IP of instance in the build output
stream.

```
$ ssh -i ec2_amazon-ebs.pem ubunut@<PUBLIC_IP>
```

## References

- https://wiki.debian.org/Cloud/AmazonEC2Image/Stretch
- https://wiki.debian.org/Cloud/AmazonEC2Image
- https://cloud-images.ubuntu.com/locator/ec2/

## TODO

1. Pip upgrade ( pip install --upgrade pip )

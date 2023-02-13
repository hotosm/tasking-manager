# Terraform infrastructure

## Authenticating to AWS

## Testing

### Compliance testing using `terrascan`

```
$ cd infra
$ terrascan scan
```

### Compliance testing using `terraform-compliance`

We can use Behavior Driven Development (BDD) style checks to ensure our infrastructure complies with enterprise policies

- Install `terraform-compliance` binary via containers using shell functions

```
$ function terraform-compliance { podman run --rm -v $(pwd):/target -i -t docker.io/eerkunt/terraform-compliance "$@"; }
$ terraform-compliance -h
terraform-compliance v1.3.40 initiated
```
replace `podman` with `docker` if you use docker instead of podman

- Write a gherkin file (with a `.feature` extension) defining your compliance requisites. Example:

```
$ cat compliance.feature
Feature: blah

Scenario: Cloudfront CDN needs to have IPv6 enbaled
  Given I have aws_cloudfront_distribution defined
  Then it must have is_ipv6_enabled
  And its value must be true

...
```

refer to Gherkin / Cucumber documentation for more information about this format.

- Create a local terraform plan file and convert it to json. (Remember to temporarily switch to a local backend if you are using a remote backend)

```
$ terraform plan -out=tf_plan.out
$ terraform show -json tf_plan.out > tf_plan.out.json
```

- Run compliance checks against the plan file

```
$ terraform-compliance --features /path/to/features_dir --planfile /path/to/tf_plan.out.json
$ # In our case:
$ cd infra
$ function terraform-compliance { podman run --rm -v $(pwd):/target -i -t docker.io/eerkunt/terraform-compliance "$@"; }
$ terraform-compliance --features infra/tests/compliance --planfile infra/tf_plan.out.json
```

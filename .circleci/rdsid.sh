#!/bin/bash
ARNS=$(aws rds describe-db-instances --query "DBInstances[].DBInstanceArn" --output text --region us-east-1)
for line in $ARNS; do
    TAGS=$(aws rds list-tags-for-resource --resource-name "$line" --query "TagList[]" --region us-east-1)
    MATCHES=$(echo $TAGS | python -c "import sys, json; tags = json.loads('$1'); remote = {t['Key']: t['Value'] for t in json.load(sys.stdin)}; print('$line'.split(':')[-1]) if len({'$line' for k, v in tags.items() if k in remote and v == remote[k]}) > 0 else ''")
    if [[ ! -z $MATCHES ]]; then
        echo $MATCHES
    fi
done
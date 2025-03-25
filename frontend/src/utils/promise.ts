export function cancelablePromise(promise: Promise<any>) {
  let hasCanceled_ = false;

  const wrappedPromise = new Promise((resolve, reject) => {
    promise
      .then((val) => (hasCanceled_ ? reject({ isCanceled: true }) : resolve(val)))
      .catch((error) => (hasCanceled_ ? reject({ isCanceled: true }) : reject(error)));
  });
  return {
    promise: wrappedPromise,
    cancel() {
      hasCanceled_ = true;
    },
  };
}

export async function handleErrors(response: Response) {
  if (response.ok) {
    return response;
  }

  let text;
  await response
    .clone()
    .json()
    .then((res) => {
      text = res.SubCode || response.statusText;
    });
  throw Error(text);
}

export function cancelableFetchJSON(url: string) {
  return cancelablePromise(
    fetch(url)
      .then(handleErrors)
      .then((res) => {
        return res.json();
      }),
  );
}

export function delayPromise(interval: number): { promise: Promise<any>, cancel: () => any } {
  return cancelablePromise(new Promise((res) => setTimeout(res, interval)));
}

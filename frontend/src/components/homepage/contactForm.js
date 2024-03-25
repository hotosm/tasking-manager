import { Form, Field } from 'react-final-form';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { FormSubmitButton } from '../button';
import { SERVICE_DESK } from '../../config';

export const ContactForm = (props) => {
  const labelClasses = 'db pt3 pb2';
  const fieldClasses = 'blue-grey w-100 pv3 ph2 input-reset ba b--grey-light bg-transparent';

  return (
    <Form
      onSubmit={(values) => props.submitMessage(values)}
      initialValues={props.contactUsValues}
      render={({ handleSubmit, pristine, form, submitting, values }) => {
        return (
          <div className="blue-grey mb3">
            <div className={`bg-white b--grey-light pa4`}>
              <h3 className="f3 fw6 dib blue-dark mv0">
                <FormattedMessage {...messages.contacterTitle} />
              </h3>
              <div className="pt3 lh-title">
                <FormattedMessage {...messages.contacterHeaderText} />
                {SERVICE_DESK && ' '}
                {SERVICE_DESK && (
                  <FormattedMessage
                    {...messages.contactServiceDesk}
                    values={{
                      b: (chunks) => (
                        <a
                          href={SERVICE_DESK}
                          target="_blank"
                          rel="noreferrer"
                          className="red link"
                        >
                          {chunks}
                        </a>
                      ),
                      link: <FormattedMessage {...messages.serviceDesk} />,
                    }}
                  />
                )}
              </div>
              <form id="contact-form" onSubmit={handleSubmit}>
                <fieldset className="bn pa0" disabled={submitting || props.disabledForm}>
                  <div className="cf">
                    <label className={labelClasses}>
                      <FormattedMessage {...messages.contacterName} />
                    </label>
                    <Field
                      name="name"
                      component="input"
                      type="text"
                      className={fieldClasses}
                      required
                    />
                  </div>
                  <div className="cf">
                    <label className={labelClasses}>
                      <FormattedMessage {...messages.contacterEmail} />
                    </label>
                    <Field
                      name="email"
                      type="email"
                      component="input"
                      className={fieldClasses}
                      required
                    />
                  </div>
                  <div className="cf">
                    <label className={labelClasses}>
                      <FormattedMessage {...messages.contacterMessage} />
                    </label>
                    <Field
                      name="content"
                      component="textarea"
                      type="text"
                      className={fieldClasses}
                      required
                    />
                  </div>
                  <div className="w-20-l w-40-m w-50 h-100 fr">
                    <FormSubmitButton
                      disabled={submitting || pristine}
                      className="w-100 h-100 bg-red white mt3"
                      disabledClassName="bg-red o-50 white w-100 h-100 mt3"
                    >
                      <FormattedMessage {...messages.contacterSend} />
                    </FormSubmitButton>
                  </div>
                </fieldset>
              </form>
            </div>
          </div>
        );
      }}
    ></Form>
  );
};

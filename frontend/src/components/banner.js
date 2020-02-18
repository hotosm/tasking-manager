import React from "react";

export function Banner() {

    var form = document.getElementById("optout-form");

    if (typeof form !== "undefined" && form != null) {
      if (!localStorage.getItem("optout-closed")) {
        form.style.display = "grid";
      }
      document.getElementById("optout-agree").onclick = function() {
        setAgree();
      };
      document.getElementById("optout-disagree").onclick = function() {
        setDisagree();
      };
    }

    function closeForm() {
      form.style.display = "none";
      localStorage.setItem("optout-closed", "true");
    }
    function setAgree() {
      window._paq.push(["rememberConsentGiven"]);
      closeForm();
    }
    function setDisagree() {
      window._paq.push(["forgetConsentGiven"]);
      closeForm();
    }

    return (
      <div id="optout-form">
        <div id="optout-contents">
          <p>
            <a id="privlink" href="https://hotosm.org/privacy">
              About the information we collect
            </a>
          </p>
          <p>
            We use cookies and similar technologies to recognize and analyze
            your visits, and measure traffic usage and activity. You can learn
            about how we use the data about your visit or information you
            provide reading our{" "}
            <a href="https://hotosm.org/privacy">Privacy Policy</a>. By clicking
            "I Agree", you consent to the use of cookies.
          </p>
          <div id="optout-buttons">
            <div className="optout-button" id="optout-disagree">
              I do not agree
            </div>
            <div className="optout-button" id="optout-agree">
              I agree
            </div>
          </div>
        </div>
      </div>
    );
}

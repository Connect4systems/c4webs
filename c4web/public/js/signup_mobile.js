(() => {
  const getSignupForm = () => document.querySelector("#signup_form, form[data-login-form='signup'], form[action*='sign_up']");

  const addMobileField = () => {
    if (window.location.pathname.replace(/\/$/, "") !== "/login") return;
    const signupForm = getSignupForm();
    if (!signupForm || signupForm.querySelector("input[name='mobile_no']")) return;

    const emailInput = signupForm.querySelector("input[type='email'], input[name='email']");
    if (!emailInput) return;

    const mobileInput = document.createElement("input");
    mobileInput.type = "tel";
    mobileInput.name = "mobile_no";
    mobileInput.placeholder = "Mobile Number";
    mobileInput.required = true;
    mobileInput.autocomplete = "tel";
    mobileInput.className = emailInput.className;
    emailInput.insertAdjacentElement("afterend", mobileInput);
  };

  const guardSubmit = () => {
    const signupForm = getSignupForm();
    if (!signupForm || signupForm.dataset.mobileValidated === "1") return;

    signupForm.addEventListener("submit", (event) => {
      const mobileField = signupForm.querySelector("input[name='mobile_no']");
      if (!mobileField || !mobileField.value.trim()) {
        event.preventDefault();
        (window.frappe && frappe.msgprint)
          ? frappe.msgprint("Please enter your mobile number.")
          : alert("Please enter your mobile number.");
      }
    });

    signupForm.dataset.mobileValidated = "1";
  };

  const run = () => {
    addMobileField();
    guardSubmit();
  };

  document.addEventListener("DOMContentLoaded", run);
  setTimeout(run, 300);
})();

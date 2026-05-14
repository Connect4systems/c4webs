(() => {
  const getSignupForm = () => document.querySelector("#signup_form, form[data-login-form='signup'], form[action*='sign_up']");
  const getMobileField = () => getSignupForm()?.querySelector("input[name='mobile_no']");
  const showMobileMessage = () => {
    (window.frappe && frappe.msgprint)
      ? frappe.msgprint("Please enter your mobile number.")
      : alert("Please enter your mobile number.");
  };

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

  const validateMobile = (event) => {
    const mobileField = getMobileField();
    if (!mobileField || mobileField.value.trim()) return true;

    event?.preventDefault();
    event?.stopImmediatePropagation?.();
    showMobileMessage();
    return false;
  };

  const guardSubmit = () => {
    const signupForm = getSignupForm();
    if (!signupForm || signupForm.dataset.mobileValidated === "1") return;

    signupForm.addEventListener("submit", validateMobile);
    signupForm.querySelectorAll("button, input[type='submit']").forEach((button) => {
      button.addEventListener("click", validateMobile, true);
    });

    signupForm.dataset.mobileValidated = "1";
  };

  const patchFrappeCall = () => {
    if (!window.frappe?.call || frappe.call.c4MobilePatched) return;

    const originalCall = frappe.call;
    frappe.call = function patchedFrappeCall(options) {
      if (options?.method?.includes("sign_up")) {
        const mobileField = getMobileField();
        if (mobileField) {
          options.args = options.args || {};
          options.args.mobile_no = mobileField.value.trim();
        }
      }

      return originalCall.apply(this, arguments);
    };
    frappe.call.c4MobilePatched = true;
  };

  const run = () => {
    addMobileField();
    guardSubmit();
    patchFrappeCall();
  };

  document.addEventListener("DOMContentLoaded", run);
  setTimeout(run, 300);
})();

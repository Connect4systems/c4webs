(() => {
  const isSignupPage = () => {
    const path = window.location.pathname.replace(/\/$/, "");
    return ["/login", "/signup", "/sign-up", "/register"].includes(path)
      || document.body.innerText.includes("Create a PIT Account");
  };

  const getEmailField = () => {
    const fields = Array.from(document.querySelectorAll("input[type='email'], input[name='email']"));
    return fields.find((field) => {
      const root = field.closest("form, .page-card, .login-content, .signup-content, .web-form, section, main, div");
      const text = root?.innerText || document.body.innerText;
      return /sign up|create .*account/i.test(text);
    }) || fields[0];
  };

  const getSignupRoot = () => {
    const emailField = getEmailField();
    return emailField?.closest("form, .page-card, .login-content, .signup-content, .web-form, section, main, div");
  };

  const getMobileField = () => getSignupRoot()?.querySelector("input[name='mobile_no']");
  const showMobileMessage = () => {
    (window.frappe && frappe.msgprint)
      ? frappe.msgprint("Please enter your mobile number.")
      : alert("Please enter your mobile number.");
  };

  const addMobileField = () => {
    if (!isSignupPage()) return;
    const signupRoot = getSignupRoot();
    if (!signupRoot || signupRoot.querySelector("input[name='mobile_no']")) return;

    const emailInput = getEmailField();
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
    const signupRoot = getSignupRoot();
    if (!signupRoot || signupRoot.dataset.mobileValidated === "1") return;

    signupRoot.addEventListener("submit", validateMobile);
    signupRoot.querySelectorAll("button, input[type='submit']").forEach((button) => {
      button.addEventListener("click", validateMobile, true);
    });

    signupRoot.dataset.mobileValidated = "1";
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
  setTimeout(run, 1000);
  new MutationObserver(run).observe(document.documentElement, { childList: true, subtree: true });
})();

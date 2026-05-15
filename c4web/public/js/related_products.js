frappe.ready(function () {
    const WHATSAPP_NUMBER = "201507447504";

    function addSignupMobileNumber() {
        if (window.location.pathname.replace(/\/$/, "") !== "/login") return;

        const signupForm = $(".form-signup").first();
        if (!signupForm.length || signupForm.find("#signup_mobile_no").length) return;

        const emailInput = signupForm.find("#signup_email, input[name='email'], input[type='email']").first();
        if (!emailInput.length) return;

        const mobileInput = $(`
            <input type="tel"
                id="signup_mobile_no"
                name="mobile_no"
                class="${emailInput.attr("class") || "form-control"}"
                placeholder="Mobile Number"
                autocomplete="tel"
                required>
        `);

        emailInput.after(mobileInput);
    }

    function patchSignupSubmit() {
        const signupForm = $(".form-signup").first().get(0);
        if (signupForm && !signupForm.c4DirectSignupPatched) {
            signupForm.addEventListener("submit", function (event) {
                const mobileNo = ($("#signup_mobile_no").val() || "").trim();
                if (!mobileNo) return;

                event.preventDefault();
                event.stopImmediatePropagation();

                const args = {
                    cmd: "c4web.api.sign_up_with_mobile",
                    email: ($("#signup_email").val() || "").trim(),
                    redirect_to: frappe.utils.sanitise_redirect(frappe.utils.get_url_arg("redirect-to")),
                    full_name: frappe.utils.xss_sanitise(($("#signup_fullname").val() || "").trim()),
                    mobile_no: mobileNo
                };

                if (!args.email || !validate_email(args.email) || !args.full_name) {
                    login.set_status("Please enter a valid email and full name.", "red");
                    return false;
                }

                login.call(args);
                return false;
            }, true);
            signupForm.c4DirectSignupPatched = true;
        }

        $(".form-signup").off("submit.c4SignupMobile").on("submit.c4SignupMobile", function (event) {
            const mobileNo = ($("#signup_mobile_no").val() || "").trim();
            if (!mobileNo) {
                event.preventDefault();
                event.stopImmediatePropagation();
                if (window.login?.set_status) {
                    login.set_status("Please enter your mobile number.", "red");
                } else {
                    frappe.msgprint("Please enter your mobile number.");
                }
                return false;
            }
        });

        const originalCall = window.login?.call;
        if (originalCall && !originalCall.c4SignupMobilePatched) {
            window.login.call = function (args) {
                if (args?.cmd === "frappe.core.doctype.user.user.sign_up") {
                    args.mobile_no = ($("#signup_mobile_no").val() || "").trim();
                }
                return originalCall.apply(this, arguments);
            };
            window.login.call.c4SignupMobilePatched = true;
        }

        const originalFrappeCall = window.frappe?.call;
        if (originalFrappeCall && !originalFrappeCall.c4SignupMobilePatched) {
            window.frappe.call = function (options) {
                if (
                    options?.args?.cmd === "frappe.core.doctype.user.user.sign_up"
                    || options?.method === "frappe.core.doctype.user.user.sign_up"
                    || options?.method === "c4web.api.sign_up_with_mobile"
                ) {
                    options.args = options.args || {};
                    options.args.mobile_no = ($("#signup_mobile_no").val() || "").trim();
                }

                return originalFrappeCall.apply(this, arguments);
            };
            window.frappe.call.c4SignupMobilePatched = true;
        }
    }

    function setupSignupMobileNumber() {
        addSignupMobileNumber();
        patchSignupSubmit();
    }

    setupSignupMobileNumber();
    $(document).on("login_rendered hashchange", setupSignupMobileNumber);
    setTimeout(setupSignupMobileNumber, 500);
    setTimeout(setupSignupMobileNumber, 1500);

    function renderRelatedProducts() {
        if (!window.location.pathname.includes("/products/")) return;

        frappe.call({
            method: "c4web.api.get_related_products",
            args: {
                route: window.location.pathname,
                limit: 30
            },
            callback: function (r) {
                $(".c4-product-price").remove();
                $(".c4-product-actions").remove();

                if (!r.message || !r.message.length) return;

                $(".c4-related-products-section").remove();

                let products = r.message;

                let html = `
                    <section class="c4-related-products-section">
                        <div class="c4-related-container">
                            <h2 class="c4-related-title">Related Products</h2>
                            <div class="c4-related-title-line"></div>

                            <button class="c4-related-arrow c4-related-prev" type="button">&#10094;</button>

                            <div class="c4-related-scroll" id="c4-related-scroll">
                `;

                products.forEach(function (product) {
                    let productUrl = "/" + product.route;
                    let image = product.website_image || "/assets/erpnext/images/ui-states/default-image.png";
                    let name = product.web_item_name || product.item_code;
                    let price = product.price_display ? product.price_display : "";

                    let whatsappText = encodeURIComponent(
                        "Hello, I want to ask about this product:\n" +
                        name + "\n" +
                        window.location.origin + productUrl
                    );

                    html += `
                        <div class="c4-related-card">
                            <a href="${productUrl}" class="c4-related-image-link">
                                <div class="c4-related-image-box">
                                    <img src="${image}" class="c4-related-image" alt="${name}">
                                </div>
                            </a>

                            <a href="${productUrl}" class="c4-related-name">${name}</a>

                            <div class="c4-related-price">${price}</div>

                            <div class="c4-related-actions">
                                <a href="${productUrl}" class="c4-related-view">View</a>
                                <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappText}"
                                   target="_blank"
                                   class="c4-related-whatsapp">WhatsApp</a>
                            </div>
                        </div>
                    `;
                });

                html += `
                            </div>

                            <button class="c4-related-arrow c4-related-next" type="button">&#10095;</button>
                        </div>
                    </section>
                `;

                let productCard = $("button, a").filter(function () {
                    return $(this).text().trim().toLowerCase().includes("add to quote");
                }).first().closest(".card, .row, .container");

                if (productCard.length) {
                    productCard.after(html);
                } else {
                    $("footer, .web-footer").first().before(html);
                }

                let scrollBox = document.getElementById("c4-related-scroll");

                $(".c4-related-next").on("click", function () {
                    scrollBox.scrollBy({ left: 250, behavior: "smooth" });
                });

                $(".c4-related-prev").on("click", function () {
                    scrollBox.scrollBy({ left: -250, behavior: "smooth" });
                });

                setInterval(function () {
                    if (!scrollBox) return;

                    if (scrollBox.scrollLeft + scrollBox.clientWidth >= scrollBox.scrollWidth - 10) {
                        scrollBox.scrollTo({ left: 0, behavior: "smooth" });
                    } else {
                        scrollBox.scrollBy({ left: 250, behavior: "smooth" });
                    }
                }, 3000);
            }
        });
    }

    renderRelatedProducts();


    function fixStandardProductPriceAndImage() {
    if (!window.location.pathname.includes("/products/")) return;

    frappe.call({
        method: "c4web.api.get_product_page_info",
        args: {
            route: window.location.pathname
        },
        callback: function (r) {
            if (!r.message || !r.message.price_display) return;

            let priceText = r.message.price_display.replace(" LE", "");

            let priceNode = $("body").find("*").filter(function () {
                let t = $(this).clone().children().remove().end().text().trim();
                return /^[0-9,]+\.[0-9]{2}$/.test(t);
            }).first();

            if (priceNode.length) {
                priceNode.text(priceText);
            }
        }
    });

    $("img[itemprop='image'], .item-card img").css({
        "max-width": "100%",
        "max-height": "520px",
        "width": "auto",
        "height": "auto",
        "object-fit": "contain",
        "display": "block",
        "margin": "0 auto"
    });
}

fixStandardProductPriceAndImage();
});

import {getFunction, getFunctionBody, replaceVars} from "ctm-cf-worker-router-core";

export const noUKRedirectKey = "X-NO-UK-Redirect";

function confirmRedirect() {
    const ukRedirectUrl = "//www.xxx.xxx.xxx/";
    const ukModalElem = document.getElementById("$MODAL_ID");
    const btnReturnToUK = ukModalElem.querySelector("button.return-to-uk");

    function closeModal(modal) {
        window.dataLayer.push({
            event: 'INTERACTION_EVENT',
            interaction: {
                ixn_action: 'Click',
                ixn_object: 'UK redirect modal',
                ixn_type: 'Feature CTA',
                ixn_label: 'Yes, keep me here'
            },
        });

        modal.classList.remove("d-show");
        modal.classList.add("d-none");
        document.body.classList.remove("no-scrolls");
    }

    function openModal(modal) {
        modal.classList.remove("d-none");
        modal.classList.add("d-show");
        document.body.classList.add("no-scrolls");
        window.dataLayer.push({
            event: 'INTERACTION_EVENT',
            interaction: {
                ixn_action: 'Impression',
                ixn_object: 'UK redirect modal',
                ixn_type: 'Modal',
                ixn_label: 'Did you mean to visit our Australian site?'
            },
        });
    }

    window.dataLayer = window.dataLayer || [];

    ukModalElem.addEventListener("click", (event) => {
        event.stopPropagation();
        if (btnReturnToUK === event.target) {
            const redirectUrl = ukRedirectUrl + "?redirectPath=" + window.location.pathname;
            // console.log("Redirecting to UK site: " + redirectUrl);

            window.dataLayer.push({
                event: 'INTERACTION_EVENT',
                interaction: {
                    ixn_action: 'Link clicks',
                    ixn_object: 'UK redirect modal',
                    ixn_type: 'Feature CTA',
                    ixn_link: redirectUrl,
                    ixn_label: 'No, go to the UK site'
                },
            });

            setTimeout(function() {
                window.location.replace(redirectUrl);
            }, 500);
            ;
        } else {
            // console.log("Staying on AU site");
            document.cookie = "$NO_UKREDIRECT_KEY" + "=true; path=/; Secure";
            closeModal(ukModalElem);
        }
    })

    openModal(ukModalElem);
};

function generateUKModalCSS() {

    return `
    body.no-scrolls {
        overflow: hidden !important;
    }
    .modal-bg {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.4);
        z-index: 9990;
        justify-content: center;
        align-items: center;
    }
    .modal-bg.d-show {
        display: flex;
    }
    .modal-bg.d-none {
        display: none;
    }
    .modal {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        background-color: #fff;
        padding: 32px;
        border-radius: 12px;
        gap: 16px;
        min-width: fit-content;
        --modal-padding: clamp(5rem,35vw - 5rem, 35vw);
        width: calc(100vw - 2* var(--modal-padding));
    }
    .modal * {
        color: #001443;
        line-height: 1.36;
        text-align: center;
        width: 100%;
        background: transparent;
    }
    .modal h5 {
        font-weight: 800;
        font-size: 24px;
        margin-bottom: 8px;
    }
    .modal button {
        font-weight: 700;
        font-size: 20px;
        padding: 30px 40px;
        border: 2px solid #ECEBEB;
        border-radius: 12px;
    }
    .modal button:hover {
        border-color: #B4D4F8;
        background: #E9F2FB;
    }
    `;
}


export const getUKPopupModalHTML = async () => {

    const modalID = await crypto.randomUUID();

    const modalHTMLDOM = `<div id="${modalID}" class="modal-bg d-none">
        <div class="modal">
            <h5 class="modal-title">Did you mean to visit our Australian site?</h5>
            <button type="button" class="stay-in-au" aria-label="Stay in AU Button">
                Yes, keep me here
            </button>
            <button type="button" class="return-to-uk" aria-label="Return to UK Button">
                No, go to the UK site
            </button>
        </div>
    </div>`;

    const modalSCRIPT = `<script id="ukPopupModalJS">` + replaceVars(getFunctionBody(confirmRedirect), {MODAL_ID: modalID, NO_UKREDIRECT_KEY: noUKRedirectKey}) + `</script>`;
    const modalSTYLES = `<style id="ukPopupModalCSS">` + generateUKModalCSS() + `</style>`;

    return  modalHTMLDOM + modalSCRIPT + modalSTYLES;
};
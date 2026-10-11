import "../boot.js";
import heroPrincipal from "../../assets/hero-principal.png";
import { mountBubbles } from "../ui/bubbles.js";
import { mountCarousel } from "../ui/carousel.js";
import { mountRegistrationForm, scrollToRegistrationIfHash } from "../ui/mount-registration-form.js";

const heroImg = document.querySelector(".hero-visual img");
if (heroImg instanceof HTMLImageElement) {
  heroImg.src = heroPrincipal;
}

mountBubbles(document.querySelector("[data-bubbles]"));
mountCarousel(document.querySelector("[data-carousel]"));
mountRegistrationForm();
scrollToRegistrationIfHash();
window.addEventListener("hashchange", scrollToRegistrationIfHash);

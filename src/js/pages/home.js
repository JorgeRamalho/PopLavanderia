import "../boot.js";
import { mountBubbles } from "../ui/bubbles.js";
import { mountCarousel } from "../ui/carousel.js";

mountBubbles(document.querySelector("[data-bubbles]"));
mountCarousel(document.querySelector("[data-carousel]"));

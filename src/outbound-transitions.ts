/* === social buttons === */

// TODO: create & animate this element using javascript, a lot cleaner than having the code seperated into 3 different files and languages
const obt: HTMLDivElement = document.querySelector('#outbound-transition');

document.querySelectorAll('.social-button').forEach(socialButton => {
  socialButton.addEventListener('click', (e: MouseEvent) => {
    obt.style.left = e.pageX + 'px';
    obt.style.top = e.pageY + 'px';

    socialButton.classList.forEach(className => {
      if (className !== 'social-button') {
        obt.classList.add(className, 'show');
      }
    });
  });
});

// reset overlays and animations when user returns to the page via the back button
const resetAll = () => {
  obt.classList.remove(...obt.classList);

  document.querySelectorAll('.upload-wrapper').forEach(uw => {
    uw.classList.remove('fade-out');
    uw.getAnimations().forEach(anim => anim.cancel());
    uw.firstElementChild.classList.remove('overlay', 'soundcloud', 'youtube');
  });
};
window.addEventListener('pageshow', resetAll);
document.addEventListener('visibilitychange', resetAll);

/* === uploads === */

const promisifyAnimation = (animation: Animation) =>
  new Promise<void>(resolve => {
    animation.addEventListener('finish', () => resolve());
  });

// using event delegation because the uploads are loaded in dynamically
document.addEventListener('click', async e => {
  const target: HTMLElement = (e.target as HTMLElement).closest('.upload-wrapper');

  if (target) {
    // fadeout all other uploads
    document.querySelectorAll('.upload-wrapper').forEach(uploadWrapper => {
      if (uploadWrapper === target) return;

      uploadWrapper.classList.add('fade-out');
    });

    const rect = target.getBoundingClientRect();
    const translation = `translate(
      ${(window.innerWidth - rect.width) / 2 - rect.x}px,
      ${(window.innerHeight - rect.height) / 2 - rect.y}px
    )`;
    // move the element to the center of the screen
    target.animate(
      [
        {},
        {
          transform: translation,
        },
        {
          transform: `${translation} scale(10)`,
        },
      ],
      { fill: 'forwards', duration: 500, easing: 'ease-in-out' }
    );
    // when the first stage finishes (animations are event-based, not synchronous), fade the contents to the brand colour
    setTimeout(
      () =>
        target.firstElementChild.classList.add(
          'overlay',
          target.dataset['type'] === 'track' ? 'soundcloud' : 'youtube'
        ),
      250
    );
  }
});

import React from 'react';

// Mock motion components to render as regular HTML elements
const createMotionComponent = (tag: keyof React.JSX.IntrinsicElements) => {
  return React.forwardRef(({ children, ...props }: any, ref) => {
    // Remove framer-motion specific props
    const {
      initial,
      animate,
      exit,
      transition,
      whileHover,
      whileTap,
      whileFocus,
      whileDrag,
      whileInView,
      variants,
      layout,
      layoutId,
      drag,
      dragConstraints,
      dragElastic,
      onAnimationComplete,
      onAnimationStart,
      ...rest
    } = props;

    return React.createElement(tag, { ...rest, ref }, children);
  });
};

export const motion = {
  div: createMotionComponent('div'),
  span: createMotionComponent('span'),
  button: createMotionComponent('button'),
  a: createMotionComponent('a'),
  p: createMotionComponent('p'),
  img: createMotionComponent('img'),
  ul: createMotionComponent('ul'),
  li: createMotionComponent('li'),
  section: createMotionComponent('section'),
  article: createMotionComponent('article'),
  header: createMotionComponent('header'),
  footer: createMotionComponent('footer'),
  nav: createMotionComponent('nav'),
  main: createMotionComponent('main'),
  aside: createMotionComponent('aside'),
  form: createMotionComponent('form'),
  input: createMotionComponent('input'),
  textarea: createMotionComponent('textarea'),
  label: createMotionComponent('label'),
  svg: createMotionComponent('svg'),
  path: createMotionComponent('path'),
};

// AnimatePresence just renders children directly
export const AnimatePresence = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

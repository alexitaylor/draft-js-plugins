/* eslint-disable react/no-array-index-key */
import React from 'react';
import { getVisibleSelectionRect } from 'draft-js';

// TODO make toolbarHeight to be determined or a parameter
const toolbarHeight = 30;

const getRelativeParent = (element) => {
  if (!element) {
    return null;
  }

  const position = window.getComputedStyle(element).getPropertyValue('position');
  if (position !== 'static') {
    return element;
  }

  return getRelativeParent(element.parentElement);
};

export default class Toolbar extends React.Component {

  state = {
    isVisible: false,
    position: undefined,

    /**
     * If this is set, the toolbar will render this instead of the regular
     * structure and will also be shown when the editor loses focus.
     * @type {Component}
     */
    overrideContent: undefined
  }

  componentWillMount() {
    this.props.store.subscribeToItem('selection', this.onSelectionChanged);
  }

  componentWillUnmount() {
    this.props.store.unsubscribeFromItem('selection', this.onSelectionChanged);
  }

  /**
   * This can be called by a child in order to render custom content instead
   * of the regular structure. It's the responsibility of the callee to call
   * this function again with `undefined` in order to reset `overrideContent`.
   * @param {Component} overrideContent
   */
  onOverrideContent = (overrideContent) => {
    this.setState({ overrideContent });
  };

  onSelectionChanged = () => {
    // need to wait a tick for window.getSelection() to be accurate
    // when focusing editor with already present selection
    setTimeout(() => {
      if (!this.toolbar) return;
      const relativeParent = getRelativeParent(this.toolbar.parentElement);
      const relativeRect = (relativeParent || document.body).getBoundingClientRect();
      const selectionRect = getVisibleSelectionRect(window);

      if (!selectionRect) return;

      const position = {
        top: (selectionRect.top - relativeRect.top) - toolbarHeight,
        left: (selectionRect.left - relativeRect.left) + (selectionRect.width / 2),
      };

      // Align pointer on the toolbar of selected text
      const left = position.left - ((this.toolbar.offsetWidth + 10) / 2);
      const right = (window.innerWidth - position.left) - ((this.toolbar.offsetWidth + 10) / 2);

      // Steps below to modify pseudo element styles:
      // 1. Create a new style tag
      const style = document.createElement('style');
      // 2. Append the style tag to head
      document.head.appendChild(style);
      // 3. Grab the stylesheet object
      const sheet = style.sheet;

      // Align pointer and toolbar
      if (left < 0) {
        position.left += Math.abs(left);
        // 4. Use addRule inject pseudo styles
        sheet.addRule(`.${this.props.theme.toolbarStyles.toolbar}::before`, `left: ${(left + position.left - 5)}px`);
        sheet.addRule(`.${this.props.theme.toolbarStyles.toolbar}::after`, `left: ${(left + position.left - 5)}px`);
      } else if (right < 0) {
        position.left -= Math.abs(right);
        // 4. Use addRule inject pseudo styles
        sheet.addRule(`.${this.props.theme.toolbarStyles.toolbar}::before`, `left: ${(Math.abs(right) + (this.toolbar.offsetWidth/2))}px`);
        sheet.addRule(`.${this.props.theme.toolbarStyles.toolbar}::after`, `left: ${(Math.abs(right) + (this.toolbar.offsetWidth/2))}px`);
      } else {
        // 4. Use addRule inject pseudo styles
        sheet.addRule(`.${this.props.theme.toolbarStyles.toolbar}::before`, `left: ${(this.toolbar.offsetWidth/2)}px`);
        sheet.addRule(`.${this.props.theme.toolbarStyles.toolbar}::after`, `left: ${(this.toolbar.offsetWidth/2)}px`);
      }

      this.setState({ position });
    });
  };

  getStyle() {
    const { store } = this.props;
    const { overrideContent, position } = this.state;
    const selection = store.getItem('getEditorState')().getSelection();
    // overrideContent could for example contain a text input, hence we always show overrideContent
    // TODO: Test readonly mode and possibly set isVisible to false if the editor is readonly
    const isVisible = (!selection.isCollapsed() && selection.getHasFocus()) || overrideContent;
    const style = { ...position };

    if (isVisible) {
      style.visibility = 'visible';
      style.transform = 'translate(-50%) scale(1)';
      style.transition = 'transform 0.15s cubic-bezier(.3,1.2,.2,1)';
    } else {
      style.transform = 'translate(-50%) scale(0)';
      style.visibility = 'hidden';
    }

    return style;
  }

  handleToolbarRef = (node) => {
    this.toolbar = node;
  };

  render() {
    const { theme, store, structure } = this.props;
    const { overrideContent: OverrideContent } = this.state;
    const childrenProps = {
      theme: theme.buttonStyles,
      getEditorState: store.getItem('getEditorState'),
      setEditorState: store.getItem('setEditorState'),
      onOverrideContent: this.onOverrideContent
    };

    return (
      <div
        className={theme.toolbarStyles.toolbar}
        style={this.getStyle()}
        ref={this.handleToolbarRef}
      >
        {OverrideContent
          ? <OverrideContent {...childrenProps} />
          : structure.map((Component, index) =>
            <Component key={index} {...childrenProps} />)}
      </div>
    );
  }
}

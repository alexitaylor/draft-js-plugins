import React, { Component } from 'react';
import styles from './styles.css';
import SocialBar from '../../shared/SocialBar';
import NavBar from '../../shared/NavBar';
import Separator from '../../shared/Separator';
import MyEditor from './MyEditor';

export default class App extends Component {
  render() {
    return (
      <div>
        <NavBar />
        <Separator />

            <div className={styles.container}>
              <h1>My Editor</h1>
              <MyEditor />
            </div>

        <SocialBar />
      </div>

    );
  }
}

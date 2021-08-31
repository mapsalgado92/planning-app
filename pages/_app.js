import { Fragment } from 'react';
import Head from 'next/head';
import PageLayout from '../components/layout/PageLayout'

import 'bootstrap/dist/css/bootstrap.css'
import '../styles/global.css'

export default function MyApp(props) {
  const { Component, pageProps } = props;


  return (
    <Fragment>
      <Head>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>
      </Head>
      <PageLayout>
        <Component {...pageProps} />
      </PageLayout>
    </Fragment>
  );
}
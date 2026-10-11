"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";

const Sculpture = dynamic(() => import("@/components/store/hero-sculpture"), {
  ssr: false,
  loading: () => <div className="h-full w-full" aria-hidden />,
});

class WebGLBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    /* WebGL unavailable — fall back to statis visual */
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function HeroSculptureLazy() {
  return (
    <WebGLBoundary fallback={<div className="h-full w-full" aria-hidden />}>
      <div className="h-full w-full" role="img" aria-label="Three-dimensional MAISON HOMME sculpture">
        <Sculpture />
      </div>
    </WebGLBoundary>
  );
}
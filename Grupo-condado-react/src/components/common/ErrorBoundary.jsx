import { Component } from "react";

// Si una pantalla falla al dibujarse, muestra un aviso en lugar de dejarla en blanco
class ErrorBoundary extends Component {
  state = { fallo: false };

  static getDerivedStateFromError() {
    return { fallo: true };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (!this.state.fallo) return this.props.children;
    return (
      <div className="error-banner mt-3">
        <span><i className="fa fa-exclamation-triangle me-2" />No se pudo mostrar esta pantalla. Volvé a intentarlo.</span>
        <button className="btn btn-light btn-sm" onClick={() => window.location.reload()}>
          <i className="fa fa-sync me-1" />Recargar
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;

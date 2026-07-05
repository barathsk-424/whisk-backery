// Standard Render Wrapper
const SafeRender = ({ component: Component }) => {
  if (!Component)
    return (
      <div className="p-20 text-center text-brown-400">Loading Base UI...</div>
    );
  return <Component />;
};

export default SafeRender;

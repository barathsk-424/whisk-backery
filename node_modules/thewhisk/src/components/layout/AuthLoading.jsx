const AuthLoading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary font-black text-brown-300 uppercase tracking-widest text-[8px]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-brown-200 border-t-brown-500 rounded-full animate-spin" />
        Initializing Artisan Secure Protocols...
      </div>
    </div>
  );
};

export default AuthLoading;

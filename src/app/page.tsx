import Bridge from "@/components/Bridge";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#050505] p-4 relative overflow-hidden">
      
      {/* 1. Background Glow Effect */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      {/* 2. The Bridge Component */}
      <div className="z-10 w-full max-w-[480px]">
         <Bridge />
      </div>

    </main>
  );
}
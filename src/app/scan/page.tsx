import { WasteScanner } from "@/components/scan/waste-scanner";

export default function ScanPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Scan Waste
        </h1>
        <p className="text-muted-foreground">
          Use your device camera or upload an image to identify waste and find the correct bin.
        </p>
      </div>
      <WasteScanner />
    </div>
  );
}

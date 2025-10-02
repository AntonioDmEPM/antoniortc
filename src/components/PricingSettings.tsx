import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

export interface PricingConfig {
  audioInputCost: number;
  audioOutputCost: number;
  cachedAudioCost: number;
  textInputCost: number;
  textOutputCost: number;
}

const DEFAULT_PRICING: PricingConfig = {
  audioInputCost: 0.00004,
  audioOutputCost: 0.00008,
  cachedAudioCost: 0.0000025,
  textInputCost: 0.0000025,
  textOutputCost: 0.00001,
};

interface PricingSettingsProps {
  onPricingChange: (pricing: PricingConfig) => void;
}

export default function PricingSettings({ onPricingChange }: PricingSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);

  useEffect(() => {
    const saved = localStorage.getItem('pricing_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPricing(parsed);
        onPricingChange(parsed);
      } catch (e) {
        console.error('Failed to parse saved pricing:', e);
      }
    } else {
      onPricingChange(DEFAULT_PRICING);
    }
  }, []);

  const handleChange = (field: keyof PricingConfig, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newPricing = { ...pricing, [field]: numValue };
    setPricing(newPricing);
  };

  const handleSave = () => {
    localStorage.setItem('pricing_config', JSON.stringify(pricing));
    onPricingChange(pricing);
  };

  const handleReset = () => {
    setPricing(DEFAULT_PRICING);
    localStorage.removeItem('pricing_config');
    onPricingChange(DEFAULT_PRICING);
  };

  return (
    <Card className="p-6 shadow-card">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <h2 className="text-xl font-semibold">Pricing Configuration</h2>
          <ChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="audioInputCost">Audio Input Cost (per token)</Label>
              <Input
                id="audioInputCost"
                type="number"
                step="0.00000001"
                value={pricing.audioInputCost}
                onChange={(e) => handleChange('audioInputCost', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audioOutputCost">Audio Output Cost (per token)</Label>
              <Input
                id="audioOutputCost"
                type="number"
                step="0.00000001"
                value={pricing.audioOutputCost}
                onChange={(e) => handleChange('audioOutputCost', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cachedAudioCost">Cached Audio Cost (per token)</Label>
              <Input
                id="cachedAudioCost"
                type="number"
                step="0.00000001"
                value={pricing.cachedAudioCost}
                onChange={(e) => handleChange('cachedAudioCost', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="textInputCost">Text Input Cost (per token)</Label>
              <Input
                id="textInputCost"
                type="number"
                step="0.00000001"
                value={pricing.textInputCost}
                onChange={(e) => handleChange('textInputCost', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="textOutputCost">Text Output Cost (per token)</Label>
              <Input
                id="textOutputCost"
                type="number"
                step="0.00000001"
                value={pricing.textOutputCost}
                onChange={(e) => handleChange('textOutputCost', e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>Save Pricing</Button>
            <Button onClick={handleReset} variant="outline">Reset to Defaults</Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

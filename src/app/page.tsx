"use client"
import React, { useState, useRef } from 'react';
import { Upload, X, Plus, Palette, Sparkles, Star, Crown, Gem, Zap, Users, Trophy, Heart,Eye } from 'lucide-react';
import { createCoin, DeployCurrency , setApiKey} from "@zoralabs/coins-sdk";
import { parseEther } from "viem";
import { useWalletClient, usePublicClient } from "wagmi";
import { base } from "viem/chains";
import { pinataClient } from "@/utils/ipfs/client-config";

setApiKey(process.env.NEXT_PUBLIC_ZORA_API_KEY!);

interface Stat {
  name: string;
  value: string;
}

interface Link {
  platform: string;
  url: string;
}

interface FormData {
  name: string;
  symbol: string;
  description: string;
  rarity: string;
  stats: Stat[];
  links: Link[];
  payoutRecipient: string;
  platformReferrer: string;
  initialPurchaseAmount: string;
}

interface Errors {
  [key: string]: string | null;
}

const ArtCardCreator: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    symbol: '',
    description: '',
    rarity: '',
    stats: [],
    links: [],
    payoutRecipient: '',
    platformReferrer: '',
    initialPurchaseAmount: '0.01'
  });
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [artwork, setArtwork] = useState<File | null>(null);
  const [artworkPreview, setArtworkPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [errors, setErrors] = useState<Errors>({});
  const [mintedTokenData, setMintedTokenData] = useState<{
    imageHash: string;
    metadataHash: string;
    metadataUri: string;
    coinAddress?: `0x${string}`;
    transactionHash?: `0x${string}`;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const statIcons: { [key: string]: React.ComponentType<{ size?: number }> } = {
    'Creativity': Palette,
    'Uniqueness': Sparkles,
    'Popularity': Star,
    'Rarity Score': Crown,
    'Value': Gem,
    'Energy': Zap,
    'Community': Users,
    'Achievement': Trophy,
    'Appeal': Heart
  };

  const rarityOptions = [
    { value: 'Common', color: 'bg-gray-500', description: 'Standard edition' },
    { value: 'Uncommon', color: 'bg-green-500', description: 'Limited availability' },
    { value: 'Rare', color: 'bg-blue-500', description: 'Scarce collectible' },
    { value: 'Epic', color: 'bg-purple-500', description: 'Highly sought after' },
    { value: 'Legendary', color: 'bg-orange-500', description: 'Ultra rare masterpiece' },
    { value: 'Mythic', color: 'bg-red-500', description: 'One-of-a-kind creation' }
  ];

  const handleInputChange = (field: keyof FormData, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setErrors(prev => ({
          ...prev,
          artwork: 'File size must be less than 10MB'
        }));
        return;
      }

      setArtwork(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setArtworkPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      if (errors.artwork) {
        setErrors(prev => ({
          ...prev,
          artwork: null
        }));
      }
    }
  };

  const uploadToIPFS = async (file: File): Promise<string> => {
    try {
      const keyRequest = await fetch("/api/key");
      const keyData = await keyRequest.json();

      const upload = await pinataClient.upload.file(file)
        .key(keyData.JWT)
        .addMetadata({
          name: file.name,
          keyValues: {
            type: 'art-card-content',
            timestamp: new Date().toISOString()
          }
        });

      const url = `https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}`;
      return url;
    } catch (error) {
      console.error("IPFS upload error:", error);
      throw new Error(`Pinata upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const createCustomMetadata = async (): Promise<string> => {
    if (!artwork) throw new Error("Artwork is required");

    const imageUrl = await uploadToIPFS(artwork);

    const linksObject: Record<string, string> = {};
    formData.links.forEach(link => {
      if (link.platform && link.url) {
        linksObject[link.platform] = link.url;
      }
    });

    const selectedRarity = rarityOptions.find(r => r.value === formData.rarity);
    
    const metadata = {
      name: formData.name,
      symbol: formData.symbol,
      description: formData.description,
      image: imageUrl,
      type: "digital-art-card",
      links: linksObject,
      attributes: [
        {
          trait_type: "Card Type",
          value: "Digital Art Trading Card"
        },
        {
          trait_type: "Rarity",
          value: formData.rarity || "Common"
        },
        {
          trait_type: "Rarity Description",
          value: selectedRarity?.description || "Standard edition"
        },
        {
          trait_type: "Links Count",
          value: Object.keys(linksObject).length
        },
        ...formData.stats.map(stat => ({
          trait_type: stat.name,
          value: stat.value
        })),
        {
          trait_type: 'Minted Date',
          value: new Date().toISOString()
        }
      ],
      collection: {
        name: 'Digital Art Trading Cards',
        description: 'Collectible art cards minted as tradeable coins'
      }
    };

    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json'
    });
    const metadataFile = new File([metadataBlob], 'metadata.json', {
      type: 'application/json'
    });

    const metadataUrl = await uploadToIPFS(metadataFile);
    return metadataUrl;
  };

  const addStat = (): void => {
    setFormData(prev => ({
      ...prev,
      stats: [...prev.stats, { name: '', value: '' }]
    }));
  };

  const updateStat = (index: number, field: keyof Stat, value: string): void => {
    setFormData(prev => ({
      ...prev,
      stats: prev.stats.map((stat, i) =>
        i === index ? { ...stat, [field]: value } : stat
      )
    }));
  };

  const removeStat = (index: number): void => {
    setFormData(prev => ({
      ...prev,
      stats: prev.stats.filter((_, i) => i !== index)
    }));
  };

  const addLink = (): void => {
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, { platform: '', url: '' }]
    }));
  };

  const updateLink = (index: number, field: keyof Link, value: string): void => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const removeLink = (index: number): void => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Errors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Card name is required';
    }

    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Symbol is required';
    } else if (!/^[A-Z]{3,6}$/.test(formData.symbol)) {
      newErrors.symbol = 'Symbol must be 3-6 uppercase letters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Card description is required';
    }

    if (!formData.payoutRecipient.trim()) {
      newErrors.payoutRecipient = 'Payout recipient address is required';
    }

    if (!artwork) {
      newErrors.artwork = 'Artwork is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMint = async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }
    
    setIsUploading(true);
    if (!walletClient || !publicClient) {
      setErrors(prev => ({
        ...prev,
        general: "Please connect your wallet before minting."
      }));
      setIsUploading(false);
      return;
    }

    try {
      const metadataUri = await createCustomMetadata();

      const coinParams = {
        name: formData.name,
        symbol: formData.symbol,
        uri: metadataUri,
        payoutRecipient: formData.payoutRecipient as `0x${string}`,
        chainId: base.id,
        currency: DeployCurrency.ETH,
        version: "v4",
        initialPurchaseWei: parseEther(formData.initialPurchaseAmount || "0.01"),
      };

      const { address: coinAddress, hash: transactionHash } = await createCoin(
        coinParams,
        walletClient,
        publicClient
      );

      setMintedTokenData({
        imageHash: artwork?.name || 'artwork',
        metadataHash: metadataUri.split('/').pop() || 'metadata',
        metadataUri,
        coinAddress,
        transactionHash,
      });

      setShowSuccess(true);
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        general: error instanceof Error ? error.message : 'Minting failed. Please try again.'
      }));
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = (): void => {
    setFormData({
      name: '',
      symbol: '',
      description: '',
      rarity: '',
      stats: [],
      links: [],
      payoutRecipient: '',
      platformReferrer: '',
      initialPurchaseAmount: '0.01'
    });
    setArtwork(null);
    setArtworkPreview(null);
    setShowSuccess(false);
    setMintedTokenData(null);
    setErrors({});
  };

  const selectedRarity = rarityOptions.find(r => r.value === formData.rarity);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white font-sans">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-lg border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-bold text-xl border border-purple-300">
                <Palette className="inline mr-2" size={24} />
                ARTCOIN
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Digital Art Trading Cards
              </div>
            </div>
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-lg font-bold text-lg border border-pink-300 transform hover:scale-105 transition-transform">
              CREATE CARD
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {errors.general && (
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-red-300 font-semibold">{errors.general}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title Panel */}
            <div className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-full">
                  <Sparkles size={32} className="text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Create Your Art Card
                  </h1>
                  <p className="text-purple-300 text-lg">Turn your digital art into tradeable collectible coins</p>
                </div>
              </div>
            </div>

            {/* Basic Info Panel */}
            <div className="bg-gradient-to-r from-indigo-800/50 to-purple-800/50 backdrop-blur-lg rounded-2xl p-8 border border-indigo-500/30">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-lg">
                  <Star size={20} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-indigo-300">Basic Information</h2>
              </div>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-lg font-semibold mb-2 text-indigo-300">Card Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg bg-white/10 border ${errors.name ? 'border-red-500' : 'border-indigo-500/30'} text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      placeholder="e.g., Cosmic Nebula"
                    />
                    {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-lg font-semibold mb-2 text-indigo-300">Symbol (Ticker)</label>
                    <input
                      type="text"
                      value={formData.symbol}
                      onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                      className={`w-full px-4 py-3 rounded-lg bg-white/10 border ${errors.symbol ? 'border-red-500' : 'border-indigo-500/30'} text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      placeholder="e.g., COSMIC"
                      maxLength={6}
                    />
                    {errors.symbol && <p className="text-red-400 text-sm mt-1">{errors.symbol}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-semibold mb-2 text-indigo-300">Card Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg bg-white/10 border ${errors.description ? 'border-red-500' : 'border-indigo-500/30'} text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 h-32 resize-none`}
                    placeholder="Describe your artwork, its inspiration, and what makes it special..."
                  />
                  {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
                </div>

                <div>
                  <label className="block text-lg font-semibold mb-2 text-indigo-300">Rarity Level</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {rarityOptions.map((rarity) => (
                      <button
                        key={rarity.value}
                        onClick={() => handleInputChange('rarity', rarity.value)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.rarity === rarity.value
                            ? `${rarity.color} border-white text-white`
                            : 'bg-white/5 border-gray-600 text-gray-300 hover:border-purple-500/50'
                        }`}
                      >
                        <div className="font-bold text-sm">{rarity.value}</div>
                        <div className="text-xs opacity-80">{rarity.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Artwork Panel */}
            <div className="bg-gradient-to-r from-pink-800/50 to-purple-800/50 backdrop-blur-lg rounded-2xl p-8 border border-pink-500/30">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-2 rounded-lg">
                  <Upload size={20} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-pink-300">Artwork Upload</h2>
              </div>

              <div
                className={`border-2 border-dashed ${errors.artwork ? 'border-red-500' : 'border-pink-500/50'} rounded-xl p-8 text-center cursor-pointer hover:border-pink-400 transition-colors bg-white/5`}
                onClick={() => fileInputRef.current?.click()}
              >
                {artworkPreview ? (
                  <div className="relative">
                    <img
                      src={artworkPreview}
                      alt="Card artwork preview"
                      className="mx-auto max-h-64 rounded-lg shadow-2xl"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setArtwork(null);
                        setArtworkPreview(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload size={48} className="mx-auto text-pink-400" />
                    <div>
                      <p className="text-lg font-semibold text-pink-300">Drop your artwork here</p>
                      <p className="text-sm text-gray-400">PNG, JPG up to 10MB</p>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {errors.artwork && <p className="text-red-400 text-sm mt-2">{errors.artwork}</p>}
            </div>

            {/* Stats Panel */}
            <div className="bg-gradient-to-r from-green-800/50 to-teal-800/50 backdrop-blur-lg rounded-2xl p-8 border border-green-500/30">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-green-500 to-teal-500 p-2 rounded-lg">
                    <Trophy size={20} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-green-300">Card Stats (Optional)</h2>
                </div>
                <button
                  onClick={addStat}
                  className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-teal-600 transition-colors flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Add Stat</span>
                </button>
              </div>

              <div className="space-y-4">
                {formData.stats.map((stat, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <select
                      value={stat.name}
                      onChange={(e) => updateStat(index, 'name', e.target.value)}
                      className="px-4 py-3 rounded-lg bg-white/10 border border-green-500/30 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select Stat</option>
                      {Object.keys(statIcons).map(statName => (
                        <option key={statName} value={statName}>{statName}</option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={stat.value}
                      onChange={(e) => updateStat(index, 'value', e.target.value)}
                      className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-green-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Value"
                    />

                    <button
                      onClick={() => removeStat(index)}
                      className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Zora Configuration Panel */}
            <div className="bg-gradient-to-r from-orange-800/50 to-red-800/50 backdrop-blur-lg rounded-2xl p-8 border border-orange-500/30">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
                  <Zap size={20} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-orange-300">Coin Configuration</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-semibold mb-2 text-orange-300">Payout Recipient Address</label>
                  <input
                    type="text"
                    value={formData.payoutRecipient}
                    onChange={(e) => handleInputChange('payoutRecipient', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg bg-white/10 border ${errors.payoutRecipient ? 'border-red-500' : 'border-orange-500/30'} text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500`}
                    placeholder="0x..."
                  />
                  {errors.payoutRecipient && <p className="text-red-400 text-sm mt-1">{errors.payoutRecipient}</p>}
                </div>

                <div>
                  <label className="block text-lg font-semibold mb-2 text-orange-300">Initial Purchase Amount (ETH)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.initialPurchaseAmount}
                    onChange={(e) => handleInputChange('initialPurchaseAmount', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-orange-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="0.01"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-lg font-semibold text-orange-300">Social Links</label>
                    <button
                      onClick={addLink}
                      className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-colors flex items-center space-x-2"
                    >
                      <Plus size={16} />
                      <span>Add Link</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.links.map((link, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <select
                          value={link.platform}
                          onChange={(e) => updateLink(index, 'platform', e.target.value)}
                          className="px-4 py-3 rounded-lg bg-white/10 border border-orange-500/30 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">Platform</option>
                          <option value="Twitter">Twitter</option>
                          <option value="Instagram">Instagram</option>
                          <option value="Portfolio">Portfolio</option>
                          <option value="Website">Website</option>
                          <option value="Discord">Discord</option>
                        </select>

                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateLink(index, 'url', e.target.value)}
                          className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-orange-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="URL"
                        />

                        <button
                          onClick={() => removeLink(index)}
                          className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Preview Card */}
              <div className="bg-gradient-to-br from-purple-800/50 to-pink-800/50 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
                    <Eye size={20} className="text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-purple-300">Card Preview</h2>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-600">
                  {artworkPreview ? (
                    <img
                      src={artworkPreview}
                      alt="Card preview"
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                      <Upload size={32} className="text-gray-500" />
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white">
                        {formData.name || 'Card Name'}
                      </h3>
                      <span className="text-sm font-semibold text-gray-400">
                        {formData.symbol || 'SYMBOL'}
                      </span>
                    </div>

                    {selectedRarity && (
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${selectedRarity.color}`}></div>
                        <span className="text-sm text-gray-300">{selectedRarity.value}</span>
                      </div>
                    )}

                    <p className="text-sm text-gray-400 line-clamp-3">
                      {formData.description || 'Card description will appear here...'}
                    </p>

                    {formData.stats.length > 0 && (
                      <div className="border-t border-gray-600 pt-3">
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">Stats</h4>
                        <div className="space-y-2">
                          {formData.stats.slice(0, 3).map((stat, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {stat.name && statIcons[stat.name] && (
                                  React.createElement(statIcons[stat.name], { size: 16 })
                                )}
                                <span className="text-xs text-gray-400">{stat.name}</span>
                              </div>
                              <span className="text-xs text-white font-semibold">{stat.value}</span>
                            </div>
                          ))}
                          {formData.stats.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{formData.stats.length - 3} more stats
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {formData.links.length > 0 && (
                      <div className="border-t border-gray-600 pt-3">
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">Links</h4>
                        <div className="flex flex-wrap gap-2">
                          {formData.links.map((link, index) => (
                            link.platform && (
                              <span key={index} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                                {link.platform}
                              </span>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mint Button */}
              <button
                onClick={handleMint}
                disabled={isUploading}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  isUploading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transform hover:scale-105'
                } text-white border border-purple-300`}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Minting Card...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Zap size={20} />
                    <span>Mint Art Card</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && mintedTokenData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl p-8 max-w-md w-full border border-purple-500/30">
            <div className="text-center space-y-6">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <Crown size={32} className="text-white" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Card Minted Successfully!</h3>
                <p className="text-purple-300">Your art card has been created as a tradeable coin</p>
              </div>

              <div className="bg-black/30 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Card Name:</span>
                  <span className="text-white font-semibold">{formData.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Symbol:</span>
                  <span className="text-white font-semibold">{formData.symbol}</span>
                </div>
                {mintedTokenData.coinAddress && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Coin Address:</span>
                    <span className="text-white font-mono text-xs">
                      {mintedTokenData.coinAddress}
                    </span>
                  </div>
                )}
                {mintedTokenData.transactionHash && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Transaction:</span>
                    <span className="text-white font-mono text-xs">
                      {mintedTokenData.transactionHash}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={resetForm}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-colors"
                >
                  Create Another
                </button>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtCardCreator;
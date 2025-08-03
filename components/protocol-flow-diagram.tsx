'use client';

import React, { useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { QuoteResponse, Token } from '@/lib/1inch';

// CSS classes are now defined in the <style jsx> block below

interface ProtocolFlowDiagramProps {
  quoteData: QuoteResponse;
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
}

const ProtocolFlowDiagram: React.FC<ProtocolFlowDiagramProps> = ({
  quoteData,
  fromToken,
  toToken,
  fromAmount,
  toAmount,
}) => {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Source node
    nodes.push({
      id: 'source',
      type: 'input',
      position: { x: 0, y: 150 },
      data: {
        label: (
          <div className="token-node">
            <div className="flex items-center gap-2">
              <img src={fromToken.logoURI} alt={fromToken.symbol} className="w-6 h-6 rounded-full" />
              <div>
                <div className="font-semibold">{fromToken.symbol}</div>
                <div className="text-xs opacity-90">{fromAmount}</div>
              </div>
            </div>
          </div>
        ),
      },
      sourcePosition: Position.Right,
    });

    // Destination node
    nodes.push({
      id: 'destination',
      type: 'output',
      position: { x: 900, y: 150 },
      data: {
        label: (
          <div className="token-node" style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#059669'}}>
            <div className="flex items-center gap-2">
              <img src={toToken.logoURI} alt={toToken.symbol} className="w-6 h-6 rounded-full" />
              <div>
                <div className="font-semibold">{toToken.symbol}</div>
                <div className="text-xs opacity-90">{toAmount}</div>
              </div>
            </div>
          </div>
        ),
      },
      targetPosition: Position.Left,
    });

    // Helper function to get intermediate token symbol
    const getIntermediateToken = (protocol: any) => {
      if (protocol.toTokenAddress === '0xdac17f958d2ee523a2206206994597c13d831ec7') return 'USDT';
      if (protocol.toTokenAddress === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48') return 'USDC';
      if (protocol.toTokenAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') return 'ETH';
      return 'TOKEN';
    };
    
    // Process each path
    quoteData.protocols.forEach((pathGroup, pathIndex) => {
      const pathY = 50 + (pathIndex * 180);
      
      if (pathGroup.length === 1) {
        // Direct route - single step swap
        const step = pathGroup[0];
        const stepNodeId = `path-${pathIndex}-step-0`;
        
        nodes.push({
          id: stepNodeId,
          position: { x: 400, y: 500 },
          data: {
            label: (
              <div className="protocol-node">
                <div className="text-center mb-4">
                  <div className="text-sm font-semibold text-purple-600 mb-1">
                    Direct Swap Path
                  </div>
                  <div className="text-xs text-gray-600">
                    Single-step {fromToken.symbol} → {toToken.symbol}
                  </div>
                  <div className="text-xs text-purple-500 mt-1">
                    Executed as part of combined transaction
                  </div>
                </div>
                <div className="space-y-2">
                  {step.map((protocol, protocolIndex) => (
                    <div key={protocolIndex} className="bg-gray-50 rounded-md p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-800">{protocol.name}</span>
                        <span className="text-sm font-bold text-purple-600">{protocol.part}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(protocol.part, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });

        // Connect source to step
        edges.push({
          id: `source-to-${stepNodeId}`,
          source: 'source',
          target: stepNodeId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#8b5cf6', strokeWidth: 2},
          markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
        });

        // Connect step to destination
        edges.push({
          id: `${stepNodeId}-to-destination`,
          source: stepNodeId,
          target: 'destination',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#8b5cf6', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
        });
      } else {
        // Multi-hop route - involves intermediate tokens
        pathGroup.forEach((step, stepIndex) => {
          const stepNodeId = `path-${pathIndex}-step-${stepIndex}`;
          const stepX = 200 + (stepIndex * 250);
          
          // Determine step type and intermediate token
          let stepLabel = '';
          let stepDescription = '';
          let stepColor = '';
          
          if (stepIndex === 0) {
            const intermediateToken = getIntermediateToken(step[0]);
            stepLabel = 'Entry Step';
            stepDescription = `${fromToken.symbol} → ${intermediateToken}`;
            stepColor = 'text-orange-600';
          } else if (stepIndex === pathGroup.length - 1) {
            stepLabel = 'Final Step';
            stepDescription = `→ ${toToken.symbol}`;
            stepColor = 'text-green-600';
          } else {
            stepLabel = `Hop ${stepIndex}`;
            stepDescription = 'Intermediate swap';
            stepColor = 'text-blue-600';
          }
          
          nodes.push({
            id: stepNodeId,
            position: { x: stepX, y: pathY },
            data: {
              label: (
                <div className={stepIndex === pathGroup.length - 1 ? "intermediate-node" : "protocol-node"}>
                  <div className="text-center mb-4">
                    <div className={`text-sm font-semibold mb-1 ${stepColor}`}>
                      {stepLabel}
                    </div>
                    <div className="text-xs text-gray-600">
                      {stepDescription}
                    </div>
                    <div className="text-xs text-orange-500 mt-1">
                      Part of combined transaction
                    </div>
                  </div>
                  <div className="space-y-2">
                    {step.map((protocol, protocolIndex) => (
                      <div key={protocolIndex} className="bg-gray-50 rounded-md p-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-800 truncate">{protocol.name}</span>
                          <span className="text-sm font-bold text-orange-600">{protocol.part}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(protocol.part, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
          });

          // Connect nodes
          if (stepIndex === 0) {
            // Connect source to first step
            edges.push({
              id: `source-to-${stepNodeId}`,
              source: 'source',
              target: stepNodeId,
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#f97316', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#f97316' },
            });
          } else {
            // Connect previous step to current step
            const prevStepId = `path-${pathIndex}-step-${stepIndex - 1}`;
            edges.push({
              id: `${prevStepId}-to-${stepNodeId}`,
              source: prevStepId,
              target: stepNodeId,
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#f97316', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#f97316' },
            });
          }

          if (stepIndex === pathGroup.length - 1) {
            // Connect last step to destination
            edges.push({
              id: `${stepNodeId}-to-destination`,
              source: stepNodeId,
              target: 'destination',
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#f97316', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#f97316' },
            });
          }
        });
      }
    });

    return { nodes, edges };
  }, [quoteData, fromToken, toToken, fromAmount, toAmount]);

  return (
    <div className="w-full h-[600px] border border-border rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-white">
      <style jsx>{`
        .react-flow__node {
          border: none !important;
          background: transparent !important;
          padding: 0 !important;
        }
        .react-flow__node-input,
        .react-flow__node-output,
        .react-flow__node-default {
          border: none !important;
          background: transparent !important;
          padding: 0 !important;
        }
        .token-node {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: 2px solid #4f46e5;
          border-radius: 12px;
          padding: 16px;
          font-size: 14px;
          font-weight: 600;
          min-width: 140px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .protocol-node {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          font-size: 12px;
          min-width: 200px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .intermediate-node {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 2px solid #f59e0b;
          border-radius: 12px;
          padding: 16px;
          font-size: 12px;
          min-width: 200px;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
        }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        minZoom={0.5}
        maxZoom={2}
      >
        <Background 
          color="#e5e7eb" 
          gap={20} 
          size={1}
        />
        <Controls 
          showInteractive={false}
          position="bottom-left"
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default ProtocolFlowDiagram;

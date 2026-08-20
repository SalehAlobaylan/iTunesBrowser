'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PipelineOverview } from '@/components/platform/pipeline/pipeline-overview';
import { QueueMonitor } from '@/components/platform/pipeline/queue-monitor';
import { PipelineOperations } from '@/components/platform/pipeline/pipeline-operations';
import { ContentStageLanes } from '@/components/platform/pipeline/content-stage-lanes';

export default function PipelinePage() {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Pipeline</h1>
                <p className="mt-1 text-muted-foreground">
                    Content processing pipeline control center
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="queues">Queues</TabsTrigger>
                    <TabsTrigger value="operations">Operations</TabsTrigger>
					<TabsTrigger value="delivery">Delivery</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <PipelineOverview onSwitchTab={setActiveTab} />
                </TabsContent>

                <TabsContent value="queues">
                    <QueueMonitor />
                </TabsContent>

                <TabsContent value="operations">
                    <PipelineOperations />
                </TabsContent>

				<TabsContent value="delivery">
					<ContentStageLanes />
				</TabsContent>
            </Tabs>
        </div>
    );
}

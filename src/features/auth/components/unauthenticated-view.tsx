import { ShieldAlertIcon } from "lucide-react";

import {
    Item,
    ItemDescription ,
    ItemContent,
    ItemMedia,
    ItemTitle,
    ItemActions,
} from "@/components/ui/item"
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export const UnauthenticatedView = () => {
    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <div className="w-full max-w-lg bg-muted">
                <Item variant="outline">
                    <ItemMedia>
                        <ShieldAlertIcon className="w-16 h-16 text-red-500" />
                    </ItemMedia>
                    <ItemContent>
                        <ItemTitle>You are not authenticated</ItemTitle>
                        <ItemDescription>Please sign in to continue</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                        <SignInButton >
                            <Button variant="outline" size="sm">
                                Sign In
                            </Button>
                        </SignInButton>
                        
                    </ItemActions>
                </Item>

            </div>
        </div>
    );
}
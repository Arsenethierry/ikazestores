/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const ProductCard = ({ product }: { product: any }) => (
  <Card className="h-full flex flex-col">
    <CardHeader>
      <h3 className="font-semibold line-clamp-2">{product.name}</h3>
    </CardHeader>
    <CardContent className="flex-grow">
      <p className="text-sm text-muted-foreground mb-2">
        {product.main_category} › {product.sub_category}
      </p>
      {product.actual_price && (
        <p className="text-lg font-bold">₹{product.actual_price.toLocaleString()}</p>
      )}
    </CardContent>
    <CardFooter>
      <Button asChild className="w-full">
        <a href={product.product_url} target="_blank" rel="noopener noreferrer">
          View Product
        </a>
      </Button>
    </CardFooter>
  </Card>
);
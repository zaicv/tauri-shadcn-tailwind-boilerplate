'use client'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

const SonnerPositionDemo = () => {
  return (
    <div className='grid grid-cols-5 gap-2'>
      
      <Button
        variant='outline'
        onClick={() =>
          toast('Action completed successfully!', {
            position: 'bottom-left'
          })
        }
      >
        •
      </Button>
      
    </div>
  )
}

export default SonnerPositionDemo

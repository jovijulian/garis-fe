import React from 'react';

export const TopAmenitiesList = ({ data }: { data: any[] }) => (
    <ul className="space-y-3">
        {data.map((item, index) => (
            <li key={index} className="flex justify-between items-center text-sm">
                <span className="truncate pr-4">{index + 1}. {item.name}</span>
                <span className="font-bold flex-shrink-0">{item.request_count}x</span>
            </li>
        ))}
    </ul>
);